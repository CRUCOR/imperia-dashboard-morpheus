from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import time
import random
import psutil
import os
from typing import Optional

# Try to import nvidia-ml-py for GPU metrics
try:
    import pynvml
    pynvml.nvmlInit()
    GPU_AVAILABLE = True
except:
    GPU_AVAILABLE = False
    print("Warning: NVIDIA GPU not available or nvidia-ml-py not installed. Using mock GPU metrics.")

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
    model_name: str = Form("abp"),
    analysisId: Optional[str] = Form(None),
    pipeline_batch_size: Optional[int] = Form(256),
    model_max_batch_size: Optional[int] = Form(32),
    num_threads: Optional[int] = Form(4)
):
    """
    ABP (Anomalous Behavior Profiling) model prediction endpoint
    Analyzes network traffic (PCAP) to detect crypto mining activity
    
    Input: jsonlines file with network packet data
    Output: Per-packet predictions indicating mining activity
    """
    start_time = time.time()

    try:
        # Read file content
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 ** 2)

        print(f"[{analysisId}] Processing file: {file.filename} ({file_size_mb:.2f} MB)")
        print(f"[{analysisId}] Model: {model_name} (Crypto Mining Detection)")
        print(f"[{analysisId}] ABP Parameters:")
        print(f"  - pipeline_batch_size: {pipeline_batch_size}")
        print(f"  - model_max_batch_size: {model_max_batch_size}")
        print(f"  - num_threads: {num_threads}")

        # Parse jsonlines file (PCAP network traffic data)
        import json
        network_packets = []
        try:
            content_str = file_content.decode('utf-8')
            lines = content_str.strip().split('\n')
            
            for line in lines:
                if line.strip():
                    try:
                        packet = json.loads(line)
                        network_packets.append(packet)
                    except json.JSONDecodeError as e:
                        print(f"[{analysisId}] Warning: Could not parse line: {e}")
                        continue
            
            num_rows = len(network_packets)
            print(f"[{analysisId}] Loaded {num_rows} network packets for analysis")
            
        except Exception as e:
            print(f"[{analysisId}] Error parsing jsonlines file: {e}")
            raise Exception(f"Invalid file format. Expected jsonlines with network packet data: {e}")

        if num_rows == 0:
            raise Exception("No valid network packets found in file")

        # Simulate real processing time based on file size and batch parameters
        # More realistic timing: ~1000-5000 packets per second depending on GPU
        estimated_throughput = 2000  # packets per second
        processing_time = max(2.0, num_rows / estimated_throughput)
        
        print(f"[{analysisId}] Estimated processing time: {processing_time:.2f}s")

        # Update metrics during processing
        num_updates = int(processing_time * 2)
        for i in range(num_updates):
            update_metrics(processing=True)
            time.sleep(0.5)

        # ABP Model Analysis - Detect crypto mining patterns in network traffic
        # This is a simulation of the real Morpheus ABP model
        predictions = []
        
        for idx, packet in enumerate(network_packets):
            # Analyze packet features for mining detection
            # In real model, this would use trained weights to detect mining patterns
            
            # Extract features from packet
            dest_port = int(packet.get("dest_port", 0))
            src_port = int(packet.get("src_port", 0))
            data_len = int(packet.get("data_len", 0))
            protocol = packet.get("protocol", "6")
            
            # Heuristic-based mining detection (simulating trained model)
            # Common mining ports: 3333, 4444, 5555, 8333, 9332, 14433, 45560
            mining_ports = [3333, 4444, 5555, 8333, 9332, 14433, 45560]
            is_mining_port = dest_port in mining_ports or src_port in mining_ports
            
            # Mining traffic typically has consistent packet sizes
            is_suspicious_size = 54 <= data_len <= 100
            
            # Calculate anomaly probability (simulating model inference)
            base_probability = 0.02  # 2% baseline
            
            if is_mining_port:
                anomaly_probability = 0.85 + random.uniform(-0.1, 0.1)
            elif is_suspicious_size and random.random() < 0.1:
                anomaly_probability = 0.65 + random.uniform(-0.15, 0.15)
            else:
                anomaly_probability = base_probability + random.uniform(-0.01, 0.05)
            
            # Clamp probability
            anomaly_probability = max(0.0, min(1.0, anomaly_probability))
            
            # Model prediction output - complete JSON object from model
            # This is what the actual ABP model would return
            is_mining = anomaly_probability > 0.5
            
            prediction_entry = {
                "row_id": idx,
                "prediction": {
                    "is_mining": is_mining,
                    "mining_probability": round(anomaly_probability, 4),
                    "regular_probability": round(1.0 - anomaly_probability, 4),
                    "confidence": round(anomaly_probability if is_mining else (1.0 - anomaly_probability), 4),
                    "anomaly_score": round(anomaly_probability, 4),
                    "detected_patterns": []
                },
                "packet_info": {
                    "src_ip": packet.get("src_ip", ""),
                    "dest_ip": packet.get("dest_ip", ""),
                    "src_port": src_port,
                    "dest_port": dest_port,
                    "protocol": protocol,
                    "data_len": data_len,
                    "timestamp": packet.get("timestamp", "")
                }
            }
            
            # Add detected patterns for mining traffic
            if is_mining_port:
                prediction_entry["prediction"]["detected_patterns"].append({
                    "pattern": "suspicious_port",
                    "description": f"Connection to known mining port {dest_port}",
                    "severity": "high"
                })
            
            if is_suspicious_size:
                prediction_entry["prediction"]["detected_patterns"].append({
                    "pattern": "consistent_packet_size",
                    "description": f"Packet size ({data_len} bytes) matches mining traffic pattern",
                    "severity": "medium"
                })
            
            predictions.append(prediction_entry)

        # Calculate statistics from prediction results
        num_mining = sum(1 for p in predictions if p["prediction"]["is_mining"])
        num_regular = num_rows - num_mining
        
        # Identify suspicious IPs (IPs with high mining activity)
        ip_mining_counts = {}
        for pred in predictions:
            if pred["prediction"]["is_mining"]:
                src_ip = pred["packet_info"]["src_ip"]
                ip_mining_counts[src_ip] = ip_mining_counts.get(src_ip, 0) + 1
        
        suspicious_ips = sorted(ip_mining_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        result = {
            "analysisId": analysisId,
            "model": f"{model_name} (Crypto Mining Detection)",
            "num_rows": num_rows,
            "predictions": predictions,
            "statistics": {
                "total_packets": num_rows,
                "mining_detected": num_mining,
                "regular_traffic": num_regular,
                "mining_rate": round(num_mining / num_rows * 100, 2) if num_rows > 0 else 0,
                "suspicious_ips": [{"ip": ip, "mining_packets": count} for ip, count in suspicious_ips]
            },
            "metadata": {
                "file_name": file.filename,
                "file_size_mb": round(file_size_mb, 2),
                "processing_time_sec": round(time.time() - start_time, 2),
                "throughput_packets_per_sec": round(num_rows / (time.time() - start_time), 2),
                "gpu_used": GPU_AVAILABLE,
                "abp_parameters": {
                    "pipeline_batch_size": pipeline_batch_size,
                    "model_max_batch_size": model_max_batch_size,
                    "num_threads": num_threads
                }
            }
        }

        # Reset metrics after processing
        update_metrics(processing=False)

        print(f"[{analysisId}] Processing completed in {time.time() - start_time:.2f}s")
        print(f"[{analysisId}] Results: {num_rows} packets analyzed")
        print(f"[{analysisId}] Mining detected: {num_mining} packets ({result['statistics']['mining_rate']}%)")
        print(f"[{analysisId}] Throughput: {result['metadata']['throughput_packets_per_sec']:.2f} packets/s")

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
        "version": "1.0.0",
        "model": "ABP (Mock)",
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
