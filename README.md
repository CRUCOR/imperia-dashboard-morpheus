# Imperia Dashboard Morpheus

Arquitectura Kubernetes para análisis de imágenes médicas con modelo ABP (Morpheus + Triton).

## Arquitectura

La aplicación consta de 4 servicios principales desplegados en Kubernetes:

- **Frontend** (React + Vite + Nginx): Interfaz de usuario con health check
- **Backend** (Node.js + Express): API REST que gestiona análisis y métricas
- **Morpheus-Triton** (Python + FastAPI): Servicio de inferencia con modelo ABP (mock)
- **PostgreSQL**: Base de datos para almacenar análisis y métricas

## Estructura del Proyecto

```
imperia-dashboard-morpheus/
├── backend/                    # Backend Node.js/Express
│   ├── src/
│   │   └── index.ts           # API endpoints
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── morpheus-triton/           # Servicio de modelos ML
│   ├── src/
│   │   └── main.py            # FastAPI + modelo ABP mock
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                  # Frontend React
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── postgres/                  # Configuración DB
│   └── init/
│       └── 01-init-db.sql    # Schema inicial
├── k8s/                       # Manifiestos Kubernetes
│   └── base/
│       ├── namespace.yaml
│       ├── postgres-*.yaml
│       ├── backend-*.yaml
│       ├── morpheus-*.yaml
│       └── frontend-*.yaml
└── README.md
```

## Endpoints del Backend

### Análisis
- **POST /analyze** - Iniciar análisis de imagen
  - Body: `multipart/form-data` con `file`, `modelName`, `parameters`
  - Response: `{ analysisId, status: "processing" }`

### Monitoreo
- **GET /health** - Health check del backend
- **GET /status** - Estado de todos los servicios
- **GET /metrics/global** - Métricas globales del sistema
- **GET /metrics/:analysisId** - Métricas de un análisis específico
- **GET /results/:analysisId** - Resultado de un análisis

## Base de Datos

### Tablas

1. **analyses** - Información de cada análisis
   - id, model_name, status, result, duration_ms, error, created_at, completed_at

2. **analysis_metrics** - Métricas recolectadas cada 5s durante ejecución
   - analysis_id, gpu_usage, gpu_mem_mb, cpu_usage, ram_mb, throughput, timestamp

3. **global_metrics** - Métricas globales del sistema
   - gpu_usage, gpu_mem_mb, cpu_usage, ram_mb, services_status, timestamp

## Deployment en Kubernetes

### Pre-requisitos

- Kubernetes cluster (minikube, kind, o cluster productivo)
- kubectl configurado
- Docker para construir las imágenes

### Paso 1: Construir Imágenes Docker

```bash
# Backend
cd backend
docker build -t imperia-backend:latest .

# Morpheus-Triton
cd ../morpheus-triton
docker build -t morpheus-triton:latest .

# Frontend
cd ../frontend
docker build -t imperia-frontend:latest .
```

### Paso 2: Cargar Imágenes en el Cluster (si usas minikube/kind)

```bash
# Para minikube
minikube image load imperia-backend:latest
minikube image load morpheus-triton:latest
minikube image load imperia-frontend:latest

# Para kind
kind load docker-image imperia-backend:latest
kind load docker-image morpheus-triton:latest
kind load docker-image imperia-frontend:latest
```

### Paso 3: Desplegar en Kubernetes

```bash
# Aplicar todos los manifiestos
kubectl apply -f k8s/base/

# Verificar el namespace
kubectl get ns ai-platform

# Verificar los recursos
kubectl get all -n ai-platform
```

### Paso 4: Verificar el Deployment

```bash
# Ver pods
kubectl get pods -n ai-platform

# Ver servicios
kubectl get svc -n ai-platform

# Logs del backend
kubectl logs -n ai-platform -l app=backend -f

# Logs de morpheus
kubectl logs -n ai-platform -l app=morpheus-triton -f

# Logs de postgres
kubectl logs -n ai-platform -l app=postgres -f
```

### Paso 5: Acceder a la Aplicación

```bash
# Si usas minikube
minikube service frontend-service -n ai-platform

# Si usas port-forward
kubectl port-forward -n ai-platform svc/frontend-service 8080:80
kubectl port-forward -n ai-platform svc/backend-service 3000:3000

# Acceder al frontend
# http://localhost:8080

# Probar el backend
curl http://localhost:3000/health
curl http://localhost:3000/status
```

## Testing del Flujo Completo

### 1. Health Checks

```bash
# Backend
curl http://localhost:3000/health

# Morpheus (port-forward primero)
kubectl port-forward -n ai-platform svc/morpheus-triton-service 8000:8000
curl http://localhost:8000/health
```

### 2. Verificar Estado de Servicios

```bash
curl http://localhost:3000/status
```

### 3. Ejecutar un Análisis de Prueba

```bash
# Crear archivo de prueba
echo "test image data" > test-image.jpg

# Enviar análisis
curl -X POST http://localhost:3000/analyze \
  -F "file=@test-image.jpg" \
  -F "modelName=abp" \
  -F "parameters={}"

# Respuesta esperada:
# {
#   "analysisId": "analysis_1234567890_abc123",
#   "status": "processing",
#   "message": "Analysis started successfully"
# }
```

### 4. Consultar Resultados

```bash
# Reemplazar ANALYSIS_ID con el ID obtenido
ANALYSIS_ID="analysis_1234567890_abc123"

# Ver resultado
curl http://localhost:3000/results/$ANALYSIS_ID

# Ver métricas del análisis
curl http://localhost:3000/metrics/$ANALYSIS_ID
```

### 5. Ver Métricas Globales

```bash
curl http://localhost:3000/metrics/global
```

## Verificar Base de Datos

```bash
# Conectar a postgres
kubectl exec -it -n ai-platform deployment/postgres -- psql -U imperia_user -d imperia_db

# Consultas útiles
SELECT * FROM analyses ORDER BY created_at DESC LIMIT 5;
SELECT * FROM analysis_metrics WHERE analysis_id = 'YOUR_ANALYSIS_ID';
SELECT * FROM global_metrics ORDER BY timestamp DESC LIMIT 10;

# Salir
\q
```

## Troubleshooting

### Pods no inician

```bash
# Ver eventos
kubectl get events -n ai-platform --sort-by='.lastTimestamp'

# Describir pod problemático
kubectl describe pod -n ai-platform POD_NAME

# Ver logs
kubectl logs -n ai-platform POD_NAME
```

### Problemas de conectividad entre servicios

```bash
# Verificar DNS interno
kubectl exec -it -n ai-platform deployment/backend -- nslookup postgres-service
kubectl exec -it -n ai-platform deployment/backend -- nslookup morpheus-triton-service

# Probar conectividad
kubectl exec -it -n ai-platform deployment/backend -- curl http://morpheus-triton-service:8000/health
```

### Problemas con PVC

```bash
# Ver PVC
kubectl get pvc -n ai-platform

# Describir PVC
kubectl describe pvc postgres-pvc -n ai-platform

# Si el PVC está en Pending, verificar StorageClass
kubectl get storageclass
```

## Limpieza

```bash
# Eliminar todo el namespace (cuidado: elimina todos los datos)
kubectl delete namespace ai-platform

# O eliminar recursos individualmente
kubectl delete -f k8s/base/
```

## Próximos Pasos

1. **Configurar Ingress** para exponer servicios externamente
2. **Agregar autenticación** (JWT, OAuth)
3. **Implementar modelo ABP real** en lugar del mock
4. **Configurar monitoreo** (Prometheus + Grafana)
5. **Agregar CI/CD** (GitHub Actions, ArgoCD)
6. **Configurar HPA** (Horizontal Pod Autoscaling)
7. **Agregar pruebas** (unit, integration, e2e)

## Notas de Seguridad

⚠️ **IMPORTANTE**: Los secrets en `postgres-secret.yaml` están en texto plano para desarrollo. En producción:

- Usar Sealed Secrets o External Secrets Operator
- Rotar credenciales regularmente
- Habilitar RBAC
- Usar Network Policies
- Habilitar Pod Security Standards

## Licencia

MIT
