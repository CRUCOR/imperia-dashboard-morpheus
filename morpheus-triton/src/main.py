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
    model: str = Form("abp"),
    parameters: str = Form("{}"),
    analysisId: Optional[str] = Form(None)
):
    """
    Mock ABP model prediction endpoint
    Simulates processing and returns mock results
    """
    start_time = time.time()

    try:
        # Read file content
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 ** 2)

        print(f"[{analysisId}] Processing file: {file.filename} ({file_size_mb:.2f} MB)")
        print(f"[{analysisId}] Model: {model}")
        print(f"[{analysisId}] Parameters: {parameters}")

        # Simulate processing time (2-5 seconds)
        processing_time = random.uniform(2, 5)

        # Update metrics during processing
        for i in range(int(processing_time * 2)):  # Update every 0.5s
            update_metrics(processing=True)
            time.sleep(0.5)

        # Mock ABP analysis result
        mock_result = {
            "analysisId": analysisId,
            "model": model,
            "predictions": [
                {
                    "class": "benign",
                    "confidence": random.uniform(0.85, 0.99),
                    "bounding_box": {
                        "x": random.randint(100, 300),
                        "y": random.randint(100, 300),
                        "width": random.randint(50, 150),
                        "height": random.randint(50, 150)
                    }
                },
                {
                    "class": "malignant",
                    "confidence": random.uniform(0.01, 0.15),
                    "bounding_box": {
                        "x": random.randint(400, 600),
                        "y": random.randint(200, 400),
                        "width": random.randint(30, 100),
                        "height": random.randint(30, 100)
                    }
                }
            ],
            "metadata": {
                "file_name": file.filename,
                "file_size_mb": file_size_mb,
                "processing_time_sec": time.time() - start_time,
                "gpu_used": GPU_AVAILABLE
            }
        }

        # Reset metrics after processing
        update_metrics(processing=False)

        print(f"[{analysisId}] Processing completed in {time.time() - start_time:.2f}s")

        return mock_result

    except Exception as e:
        print(f"[{analysisId}] Error during prediction: {str(e)}")
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
