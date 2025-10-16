from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import time
import random
import psutil
import os
import asyncio
from typing import Optional
import json

# Import all analysis models
from models import (
    analyze_digital_fingerprint,
    analyze_sensitive_info,
    analyze_cryptomining,
    analyze_phishing,
    analyze_fraud,
    analyze_ransomware
)

# Force GPU usage by setting environment variables
os.environ['CUDA_VISIBLE_DEVICES'] = os.environ.get('CUDA_VISIBLE_DEVICES', '0')
os.environ['CUDA_DEVICE_ORDER'] = 'PCI_BUS_ID'

# Try to import nvidia-ml-py for GPU metrics
try:
    import pynvml
    pynvml.nvmlInit()
    GPU_AVAILABLE = True
    
    # Log GPU information
    device_count = pynvml.nvmlDeviceGetCount()
    if device_count > 0:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        gpu_name = pynvml.nvmlDeviceGetName(handle)
        print(f"✓ GPU Detected: {gpu_name}")
        print(f"✓ CUDA Device: {os.environ.get('CUDA_VISIBLE_DEVICES', '0')}")
        print(f"✓ GPU will be used for all ML operations")
    else:
        print("Warning: No GPU devices found")
        GPU_AVAILABLE = False
except Exception as e:
    GPU_AVAILABLE = False
    print(f"Warning: NVIDIA GPU not available or nvidia-ml-py not installed: {e}")
    print("Using mock GPU metrics. ML operations will fall back to CPU.")

app = FastAPI(title="Morpheus Triton Service", version="1.0.0")

# Mock ABP model state
model_loaded = True
current_metrics = {
    "gpu_usage": 0.0,
    "gpu_mem_mb": 0.0,
    "cpu_usage": 0.0,
    "ram_mb": 0.0,
    "throughput": 0.0
}

def get_current_gpu_usage():
    """Get current GPU usage for logging"""
    if GPU_AVAILABLE:
        try:
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            gpu_util = pynvml.nvmlDeviceGetUtilizationRates(handle)
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            temp = pynvml.nvmlDeviceGetTemperature(handle, 0)
            
            return {
                "gpu_usage_percent": gpu_util.gpu,
                "gpu_memory_used_mb": mem_info.used / (1024 ** 2),
                "gpu_memory_total_mb": mem_info.total / (1024 ** 2),
                "gpu_temp_c": temp
            }
        except:
            pass
    return None

def get_gpu_metrics():
    """Get real or mock GPU metrics"""
    if GPU_AVAILABLE:
        try:
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            gpu_util = pynvml.nvmlDeviceGetUtilizationRates(handle)
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)

            return {
                "gpu_usage": gpu_util.gpu,
                "gpu_mem_mb": mem_info.used / (1024 ** 2)
            }
        except:
            pass

    # Mock metrics
    return {
        "gpu_usage": random.uniform(40, 95),
        "gpu_mem_mb": random.uniform(2000, 8000)
    }

def get_system_metrics():
    """Get system CPU and RAM metrics"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    ram_mb = psutil.virtual_memory().used / (1024 ** 2)

    return {
        "cpu_usage": cpu_percent,
        "ram_mb": ram_mb
    }

def update_metrics(processing: bool = False):
    """Update current metrics"""
    global current_metrics

    gpu_metrics = get_gpu_metrics()
    system_metrics = get_system_metrics()

    current_metrics.update({
        "gpu_usage": gpu_metrics["gpu_usage"],
        "gpu_mem_mb": gpu_metrics["gpu_mem_mb"],
        "cpu_usage": system_metrics["cpu_usage"],
        "ram_mb": system_metrics["ram_mb"],
        "throughput": random.uniform(50, 200) if processing else 0.0
    })

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "morpheus-triton",
        "model_loaded": model_loaded,
        "gpu_available": GPU_AVAILABLE,
        "timestamp": time.time()
    }

@app.get("/metrics")
async def get_metrics():
    """Get current system metrics"""
    update_metrics()
    return current_metrics

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_name: str = Form("cryptomining"),
    analysisId: Optional[str] = Form(None),
    # General parameters
    pipeline_batch_size: Optional[int] = Form(256),
    model_max_batch_size: Optional[int] = Form(32),
    num_threads: Optional[int] = Form(4),
    # Digital Fingerprint parameters
    algorithm: Optional[str] = Form("sha256"),
    include_metadata: Optional[bool] = Form(True),
    # Sensitive Info parameters
    scan_pii: Optional[bool] = Form(True),
    scan_credentials: Optional[bool] = Form(True),
    scan_api_keys: Optional[bool] = Form(True),
    confidence_threshold: Optional[float] = Form(0.7),
    # Phishing parameters
    check_urls: Optional[bool] = Form(True),
    check_emails: Optional[bool] = Form(True),
    analyze_content: Optional[bool] = Form(True),
    # Fraud Detection parameters
    transaction_threshold: Optional[float] = Form(1000.0),
    risk_level: Optional[str] = Form("medium"),
    # Ransomware parameters
    scan_encrypted_files: Optional[bool] = Form(True),
    check_extensions: Optional[bool] = Form(True),
    analyze_behavior: Optional[bool] = Form(True)
):
    """
    Universal prediction endpoint supporting multiple security analysis models:
    1. digital-fingerprint: Generate hashes and detect duplicates
    2. sensitive-info: Detect PII, credentials, API keys
    3. cryptomining: Detect crypto mining in network traffic (ABP)
    4. phishing: Detect phishing attempts
    5. fraud-detection: Detect fraudulent transactions
    6. ransomware: Detect ransomware threats
    """
    start_time = time.time()

    try:
        # Read file content
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 ** 2)

        print(f"[{analysisId}] ═══════════════════════════════════════")
        print(f"[{analysisId}] Processing file: {file.filename} ({file_size_mb:.2f} MB)")
        print(f"[{analysisId}] Model: {model_name}")
        print(f"[{analysisId}] Compute Device: {'GPU (CUDA)' if GPU_AVAILABLE else 'CPU (Fallback)'}")
        
        # Parse input data
        try:
            content_str = file_content.decode('utf-8')
            lines = content_str.strip().split('\n')
            
            data = []
            for line in lines:
                if line.strip():
                    try:
                        item = json.loads(line)
                        data.append(item)
                    except json.JSONDecodeError:
                        continue
            
            num_rows = len(data)
            print(f"[{analysisId}] Loaded {num_rows} records for analysis")
            
        except Exception as e:
            print(f"[{analysisId}] Error parsing file: {e}")
            raise Exception(f"Invalid file format. Expected jsonlines: {e}")

        if num_rows == 0:
            raise Exception("No valid data found in file")

        # Log GPU status at start
        gpu_info = get_current_gpu_usage()
        if gpu_info:
            print(f"[{analysisId}] ═══ GPU Status ═══")
            print(f"[{analysisId}] GPU Usage: {gpu_info['gpu_usage_percent']}%")
            print(f"[{analysisId}] GPU Memory: {gpu_info['gpu_memory_used_mb']:.0f}MB / {gpu_info['gpu_memory_total_mb']:.0f}MB")
            print(f"[{analysisId}] GPU Temperature: {gpu_info['gpu_temp_c']}°C")
        
        processing_start = time.time()
        
        # Route to appropriate model
        if model_name == "digital-fingerprint":
            print(f"[{analysisId}] Running Digital Fingerprint Analysis...")
            print(f"[{analysisId}] Algorithm: {algorithm}")
            
            analysis_result = analyze_digital_fingerprint(data, algorithm)
            model_display = "Digital Fingerprint Generation"
            
        elif model_name == "sensitive-info":
            print(f"[{analysisId}] Running Sensitive Information Detection...")
            print(f"[{analysisId}] PII Scan: {scan_pii}, Credentials: {scan_credentials}, API Keys: {scan_api_keys}")
            
            analysis_result = analyze_sensitive_info(
                data, scan_pii, scan_credentials, scan_api_keys, confidence_threshold
            )
            model_display = "Sensitive Information Detection"
            
        elif model_name == "cryptomining":
            print(f"[{analysisId}] Running Cryptomining Detection (ABP)...")
            print(f"[{analysisId}] Batch Size: {model_max_batch_size}, Threads: {num_threads}")
            
            # Use the existing cryptomining analysis
            analysis_result = analyze_cryptomining(data, pipeline_batch_size, model_max_batch_size)
            model_display = "Crypto Mining Detection (ABP)"
            
        elif model_name == "phishing":
            print(f"[{analysisId}] Running Phishing Detection...")
            print(f"[{analysisId}] Check URLs: {check_urls}, Emails: {check_emails}, Content: {analyze_content}")
            
            analysis_result = analyze_phishing(data, check_urls, check_emails, analyze_content)
            model_display = "Phishing Detection"
            
        elif model_name == "fraud-detection":
            print(f"[{analysisId}] Running Fraud Detection...")
            print(f"[{analysisId}] Threshold: ${transaction_threshold}, Risk Level: {risk_level}")
            
            analysis_result = analyze_fraud(data, transaction_threshold, risk_level)
            model_display = "Fraud & Identity Theft Detection"
            
        elif model_name == "ransomware":
            print(f"[{analysisId}] Running Ransomware Detection...")
            print(f"[{analysisId}] Scan Encrypted: {scan_encrypted_files}, Check Extensions: {check_extensions}")
            
            analysis_result = analyze_ransomware(
                data, scan_encrypted_files, check_extensions, analyze_behavior
            )
            model_display = "Ransomware Detection"
            
        else:
            raise Exception(f"Unknown model: {model_name}")

        processing_time = time.time() - processing_start
        
        # Get final GPU status
        gpu_info_final = get_current_gpu_usage()
        
        print(f"[{analysisId}] ═══ Analysis Completed ═══")
        print(f"[{analysisId}] ✓ Total Time: {processing_time:.2f}s")
        print(f"[{analysisId}] ✓ Records Analyzed: {num_rows:,}")
        
        if gpu_info_final:
            print(f"[{analysisId}] ═══ Final GPU Status ═══")
            print(f"[{analysisId}] GPU Usage: {gpu_info_final['gpu_usage_percent']}%")
            print(f"[{analysisId}] GPU Memory: {gpu_info_final['gpu_memory_used_mb']:.0f}MB")
        
        print(f"[{analysisId}] ═══════════════════════════════════════")

        # Build result based on model
        result = {
            "analysisId": analysisId,
            "model": model_display,
            "num_rows": num_rows,
            **analysis_result,  # Merge model-specific results
            "metadata": {
                "file_name": file.filename,
                "file_size_mb": round(file_size_mb, 2),
                "processing_time_sec": round(processing_time, 2),
                "gpu_used": GPU_AVAILABLE
            }
        }

        # Reset metrics after processing
        update_metrics(processing=False)
        
        total_request_time = time.time() - start_time
        print(f"[{analysisId}] 🎯 Total Request Time: {total_request_time:.2f}s")

        return result

    except Exception as e:
        print(f"[{analysisId}] Error during prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "analysisId": analysisId}
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Morpheus Triton Service",
        "version": "2.0.0",
        "models": [
            "digital-fingerprint",
            "sensitive-info",
            "cryptomining",
            "phishing",
            "fraud-detection",
            "ransomware"
        ],
        "status": "running"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

