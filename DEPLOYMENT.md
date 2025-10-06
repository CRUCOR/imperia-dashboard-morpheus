# Guía de Deployment - Imperia Dashboard Morpheus

## Quick Start

### Opción 1: Usando Makefile (Recomendado)

```bash
# 1. Construir todas las imágenes
make build-all

# 2. Cargar imágenes en minikube (si usas minikube)
make load-images

# 3. Desplegar en Kubernetes
make deploy

# 4. Verificar estado
make status

# 5. Ejecutar pruebas
make test

# 6. Crear port-forwards para acceso local
make port-forward
```

### Opción 2: Manual

```bash
# 1. Construir imágenes
cd backend && docker build -t imperia-backend:latest . && cd ..
cd morpheus-triton && docker build -t morpheus-triton:latest . && cd ..
cd frontend && docker build -t imperia-frontend:latest . && cd ..

# 2. Cargar en minikube (si usas minikube)
minikube image load imperia-backend:latest
minikube image load morpheus-triton:latest
minikube image load imperia-frontend:latest

# 3. Desplegar
kubectl apply -f k8s/base/

# 4. Verificar
kubectl get pods -n ai-platform
kubectl get svc -n ai-platform
```

## Flujo de Prueba Completo

### 1. Verificar que todos los servicios estén corriendo

```bash
kubectl get pods -n ai-platform
```

Deberías ver algo como:
```
NAME                              READY   STATUS    RESTARTS   AGE
backend-xxxxxxxxxx-xxxxx          1/1     Running   0          2m
backend-xxxxxxxxxx-yyyyy          1/1     Running   0          2m
morpheus-triton-xxxxxxxxxx-xxxxx  1/1     Running   0          2m
postgres-xxxxxxxxxx-xxxxx         1/1     Running   0          2m
frontend-xxxxxxxxxx-xxxxx         1/1     Running   0          2m
frontend-xxxxxxxxxx-yyyyy         1/1     Running   0          2m
```

### 2. Crear port-forwards

```bash
# Terminal 1 - Backend
kubectl port-forward -n ai-platform svc/backend-service 3000:3000

# Terminal 2 - Morpheus
kubectl port-forward -n ai-platform svc/morpheus-triton-service 8000:8000

# Terminal 3 - Frontend
kubectl port-forward -n ai-platform svc/frontend-service 8080:80
```

O usar el comando del Makefile:
```bash
make port-forward
```

### 3. Probar Health Checks

```bash
# Backend
curl http://localhost:3000/health

# Morpheus
curl http://localhost:8000/health

# Frontend
curl http://localhost:8080/health
```

### 4. Verificar Estado de Servicios

```bash
curl http://localhost:3000/status | jq
```

Deberías ver:
```json
{
  "backend": {
    "status": "healthy",
    "timestamp": "2025-10-05T..."
  },
  "postgres": {
    "status": "healthy"
  },
  "morpheus": {
    "status": "healthy",
    "service": "morpheus-triton",
    "model_loaded": true,
    "gpu_available": false,
    "timestamp": 1728168000
  }
}
```

### 5. Ejecutar un Análisis Completo

```bash
# Crear archivo de prueba
echo "Sample medical image data" > test-image.jpg

# Enviar análisis
curl -X POST http://localhost:3000/analyze \
  -F "file=@test-image.jpg" \
  -F "modelName=abp" \
  -F "parameters={\"threshold\":0.5}" \
  | jq

# Guardar el analysisId de la respuesta
# Ejemplo: "analysis_1728168000_abc123"
```

Respuesta esperada:
```json
{
  "analysisId": "analysis_1728168000_abc123",
  "status": "processing",
  "message": "Analysis started successfully"
}
```

### 6. Consultar Resultado del Análisis

```bash
# Esperar 5-10 segundos para que se complete el análisis
sleep 10

# Consultar resultado (reemplazar ANALYSIS_ID)
curl http://localhost:3000/results/analysis_1728168000_abc123 | jq
```

Respuesta esperada:
```json
{
  "analysisId": "analysis_1728168000_abc123",
  "modelName": "abp",
  "status": "completed",
  "result": {
    "analysisId": "analysis_1728168000_abc123",
    "model": "abp",
    "predictions": [
      {
        "class": "benign",
        "confidence": 0.92,
        "bounding_box": {...}
      }
    ],
    "metadata": {
      "file_name": "test-image.jpg",
      "processing_time_sec": 3.5,
      "gpu_used": false
    }
  },
  "duration_ms": 3500,
  "created_at": "2025-10-05T...",
  "completed_at": "2025-10-05T..."
}
```

### 7. Consultar Métricas del Análisis

```bash
curl http://localhost:3000/metrics/analysis_1728168000_abc123 | jq
```

Deberías ver métricas recolectadas cada 5 segundos:
```json
{
  "analysisId": "analysis_1728168000_abc123",
  "metrics": [
    {
      "id": 1,
      "analysis_id": "analysis_1728168000_abc123",
      "gpu_usage": 75.2,
      "gpu_mem_mb": 4096.5,
      "cpu_usage": 45.3,
      "ram_mb": 2048.7,
      "duration_ms": 0,
      "throughput": 125.4,
      "timestamp": "2025-10-05T..."
    },
    {
      "id": 2,
      "analysis_id": "analysis_1728168000_abc123",
      "gpu_usage": 78.5,
      "gpu_mem_mb": 4200.2,
      "cpu_usage": 48.1,
      "ram_mb": 2100.3,
      "duration_ms": 5000,
      "throughput": 130.2,
      "timestamp": "2025-10-05T..."
    }
  ]
}
```

### 8. Consultar Métricas Globales

```bash
curl http://localhost:3000/metrics/global | jq
```

### 9. Verificar Datos en la Base de Datos

```bash
# Conectar a postgres
kubectl exec -it -n ai-platform deployment/postgres -- psql -U imperia_user -d imperia_db

# Ver análisis
SELECT id, model_name, status, duration_ms, created_at FROM analyses ORDER BY created_at DESC LIMIT 5;

# Ver métricas de un análisis específico
SELECT * FROM analysis_metrics WHERE analysis_id = 'analysis_1728168000_abc123' ORDER BY timestamp;

# Contar métricas
SELECT COUNT(*) as total_metrics FROM analysis_metrics WHERE analysis_id = 'analysis_1728168000_abc123';

# Salir
\q
```

## Verificación de Conectividad Interna

```bash
# Backend puede alcanzar a Morpheus
kubectl exec -n ai-platform deployment/backend -- curl -s http://morpheus-triton-service:8000/health

# Backend puede alcanzar a Postgres
kubectl exec -n ai-platform deployment/backend -- \
  node -e "const {Pool}=require('pg'); \
  new Pool({host:'postgres-service',port:5432,database:'imperia_db',user:'imperia_user',password:'imperia_password'}) \
  .query('SELECT NOW()').then(r=>console.log('Connected:',r.rows[0])).catch(e=>console.error('Error:',e.message))"
```

## Troubleshooting

### Problema: Pods en CrashLoopBackOff

```bash
# Ver logs del pod problemático
kubectl logs -n ai-platform POD_NAME

# Ver eventos
kubectl describe pod -n ai-platform POD_NAME

# Solución común: verificar que las imágenes estén cargadas
kubectl get pods -n ai-platform -o jsonpath='{.items[*].status.containerStatuses[*].image}'
```

### Problema: PVC en Pending

```bash
# Verificar PVC
kubectl get pvc -n ai-platform
kubectl describe pvc postgres-pvc -n ai-platform

# Verificar StorageClass
kubectl get storageclass

# Solución para minikube: habilitar default storageclass
minikube addons enable default-storageclass
minikube addons enable storage-provisioner
```

### Problema: Backend no puede conectar a Postgres

```bash
# Verificar que postgres esté listo
kubectl get pods -n ai-platform -l app=postgres

# Verificar logs de postgres
kubectl logs -n ai-platform -l app=postgres

# Verificar DNS
kubectl exec -n ai-platform deployment/backend -- nslookup postgres-service

# Verificar secrets
kubectl get secret postgres-secret -n ai-platform -o yaml
```

### Problema: Backend no puede conectar a Morpheus

```bash
# Verificar que morpheus esté listo
kubectl get pods -n ai-platform -l app=morpheus-triton

# Verificar logs
kubectl logs -n ai-platform -l app=morpheus-triton

# Probar conectividad
kubectl exec -n ai-platform deployment/backend -- curl -v http://morpheus-triton-service:8000/health
```

## Monitoreo de Logs en Tiempo Real

```bash
# Backend
kubectl logs -n ai-platform -l app=backend -f

# Morpheus
kubectl logs -n ai-platform -l app=morpheus-triton -f

# Postgres
kubectl logs -n ai-platform -l app=postgres -f

# Todos juntos (requiere stern)
stern -n ai-platform '.*'
```

## Limpieza

```bash
# Eliminar todo
make clean

# O manualmente
kubectl delete namespace ai-platform
```

## Próximos Pasos

1. ✅ Levantar arquitectura base
2. ✅ Conectar backend con Morpheus/Triton
3. ✅ Implementar mock ABP
4. ✅ Persistir métricas en Postgres
5. 🔲 Agregar frontend real con dashboard
6. 🔲 Implementar modelo ABP real
7. 🔲 Configurar Ingress
8. 🔲 Agregar autenticación
9. 🔲 Configurar monitoreo (Prometheus + Grafana)
10. 🔲 CI/CD con GitHub Actions
