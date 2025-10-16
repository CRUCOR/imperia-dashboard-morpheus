# MEF Dashboard - Deployment en Kubernetes

Esta carpeta contiene todos los manifiestos necesarios para desplegar la aplicación MEF Dashboard en un cluster de Kubernetes.

## Arquitectura

La aplicación consta de 4 componentes principales:

1. **PostgreSQL** - Base de datos relacional
2. **Morpheus/Triton** - Servicio de Machine Learning
3. **Backend** - API REST (Node.js/TypeScript)
4. **Frontend** - Interfaz de usuario (React con Nginx)

## Estructura de Archivos

```
k8s/
├── namespace.yaml                    # Namespace 'mef'
├── configmap.yaml                    # Configuración de la aplicación
├── secrets.yaml                      # Credenciales (cambiar en producción)
├── postgres-pvc.yaml                 # Almacenamiento persistente para PostgreSQL
├── postgres-deployment.yaml          # Deployment de PostgreSQL
├── postgres-service.yaml             # Service de PostgreSQL
├── morpheus-triton-deployment.yaml   # Deployment de Morpheus/Triton
├── morpheus-triton-service.yaml      # Service de Morpheus/Triton
├── backend-deployment.yaml           # Deployment del Backend (2 réplicas)
├── backend-service.yaml              # Service del Backend
├── frontend-deployment.yaml          # Deployment del Frontend (2 réplicas)
└── frontend-service.yaml             # Service del Frontend (NodePort 30080)
```

## Requisitos Previos

- Kubernetes cluster en ejecución (minikube, k3s, GKE, EKS, AKS, etc.)
- kubectl instalado y configurado
- Docker instalado (para construir las imágenes)
- Al menos 4GB de RAM disponible en el cluster
- Al menos 10GB de almacenamiento disponible

## Deployment Rápido

### Opción 1: Usar el script automatizado (Recomendado)

```bash
# Desde la raíz del proyecto
./k8s-deploy.sh
```

Este script:
- Verifica los requisitos previos
- Construye las imágenes Docker
- Aplica todos los manifiestos en el orden correcto
- Espera a que todos los pods estén listos
- Muestra el estado final y la URL de acceso

### Opción 2: Deployment manual

```bash
# 1. Construir las imágenes Docker
docker build -t mef-backend:latest ./backend
docker build -t mef-frontend:latest ./frontend
docker build -t mef-morpheus:latest ./morpheus-triton

# 2. Si usas Minikube, cargar las imágenes
minikube image load mef-backend:latest
minikube image load mef-frontend:latest
minikube image load mef-morpheus:latest

# 3. Aplicar los manifiestos
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/morpheus-triton-deployment.yaml
kubectl apply -f k8s/morpheus-triton-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 4. Verificar el estado
kubectl get all -n mef

# 5. Esperar a que todos los pods estén listos
kubectl wait --for=condition=ready pod --all -n mef --timeout=300s
```

## Acceso a la Aplicación

### Con Minikube

```bash
# Obtener la URL del frontend
minikube service frontend-service -n mef --url

# O abrir directamente en el navegador
minikube service frontend-service -n mef
```

### Con otros clusters

El frontend está expuesto en el NodePort 30080:

```bash
# Obtener la IP del nodo
kubectl get nodes -o wide

# Acceder a: http://<NODE_IP>:30080
```

### Port Forwarding (para desarrollo local)

```bash
# Frontend
kubectl port-forward -n mef svc/frontend-service 8080:80

# Backend
kubectl port-forward -n mef svc/backend-service 3000:3000

# Morpheus/Triton
kubectl port-forward -n mef svc/morpheus-triton-service 8000:8000

# PostgreSQL
kubectl port-forward -n mef svc/postgres-service 5432:5432
```

## Apagar el Entorno

### Opción 1: Usar el script automatizado (Recomendado)

```bash
# Desde la raíz del proyecto
./k8s-shutdown.sh
```

Este script:
- Muestra el estado actual de los recursos
- Solicita confirmación antes de eliminar
- Elimina todos los recursos en el orden correcto
- Opcionalmente elimina los datos persistentes
- Opcionalmente elimina las imágenes Docker locales

### Opción 2: Eliminación manual

```bash
# Eliminar todos los recursos del namespace
kubectl delete namespace mef

# Esto eliminará automáticamente:
# - Todos los deployments
# - Todos los services
# - Todos los pods
# - ConfigMaps y Secrets
# - PersistentVolumeClaims y datos
```

## Comandos Útiles

### Monitoreo

```bash
# Ver todos los recursos
kubectl get all -n mef

# Ver logs del backend
kubectl logs -f -l app=backend -n mef

# Ver logs del frontend
kubectl logs -f -l app=frontend -n mef

# Ver logs de Morpheus/Triton
kubectl logs -f -l app=morpheus-triton -n mef

# Ver logs de PostgreSQL
kubectl logs -f -l app=postgres -n mef

# Ver eventos
kubectl get events -n mef --sort-by='.lastTimestamp'
```

### Escalado

```bash
# Escalar el backend
kubectl scale deployment backend --replicas=3 -n mef

# Escalar el frontend
kubectl scale deployment frontend --replicas=3 -n mef
```

### Debugging

```bash
# Describir un pod
kubectl describe pod <pod-name> -n mef

# Acceder a un pod
kubectl exec -it <pod-name> -n mef -- /bin/sh

# Ver recursos del cluster
kubectl top nodes
kubectl top pods -n mef
```

### Base de Datos

```bash
# Conectarse a PostgreSQL
kubectl exec -it <postgres-pod-name> -n mef -- psql -U mef_user -d mef_db

# Backup de la base de datos
kubectl exec <postgres-pod-name> -n mef -- pg_dump -U mef_user mef_db > backup.sql

# Restaurar base de datos
kubectl exec -i <postgres-pod-name> -n mef -- psql -U mef_user mef_db < backup.sql
```

## Configuración

### Variables de Entorno

Las variables de entorno se gestionan a través de ConfigMaps y Secrets:

- **ConfigMap** (`k8s/configmap.yaml`): Configuración no sensible
- **Secrets** (`k8s/secrets.yaml`): Credenciales y datos sensibles

Para modificar la configuración:

```bash
# Editar ConfigMap
kubectl edit configmap mef-config -n mef

# Editar Secrets
kubectl edit secret mef-secrets -n mef

# Reiniciar los pods para aplicar cambios
kubectl rollout restart deployment -n mef
```

### Almacenamiento

Por defecto, PostgreSQL usa un PersistentVolumeClaim de 10GB con la clase de almacenamiento `standard`.

Para cambiar el tamaño o la clase de almacenamiento, edita `k8s/postgres-pvc.yaml` antes del deployment.

### Recursos

Los recursos (CPU y memoria) están configurados para cada componente:

- **PostgreSQL**: 256Mi-1Gi RAM, 250m-1000m CPU
- **Morpheus/Triton**: 512Mi-2Gi RAM, 500m-2000m CPU
- **Backend**: 256Mi-1Gi RAM, 250m-1000m CPU
- **Frontend**: 128Mi-256Mi RAM, 100m-500m CPU

Para ajustarlos, edita los archivos de deployment correspondientes.

## Seguridad

### Credenciales

**IMPORTANTE**: El archivo `k8s/secrets.yaml` contiene credenciales por defecto que **DEBEN** ser cambiadas en producción.

Para generar secrets seguros:

```bash
# Generar password seguro
openssl rand -base64 32

# Crear secret desde archivo
kubectl create secret generic mef-secrets \
  --from-literal=DB_PASSWORD=<tu-password-seguro> \
  -n mef
```

### Network Policies

Actualmente no hay Network Policies configuradas. Para añadir seguridad adicional, considera implementar:

- Políticas de red para limitar la comunicación entre pods
- Ingress con TLS/SSL
- Service Mesh (Istio, Linkerd)

## Solución de Problemas

### Los pods no se inician

```bash
# Verificar eventos
kubectl get events -n mef --sort-by='.lastTimestamp'

# Describir el pod problemático
kubectl describe pod <pod-name> -n mef

# Ver logs
kubectl logs <pod-name> -n mef
```

### Problemas con imágenes

Si los pods tienen estado `ImagePullBackOff`:

```bash
# Verificar que las imágenes existan
docker images | grep mef

# Si usas Minikube, cargar las imágenes
minikube image load mef-backend:latest
minikube image load mef-frontend:latest
minikube image load mef-morpheus:latest
```

### Problemas de conectividad

```bash
# Verificar servicios
kubectl get svc -n mef

# Verificar endpoints
kubectl get endpoints -n mef

# Probar conectividad desde un pod
kubectl exec -it <backend-pod> -n mef -- curl http://postgres-service:5432
```

### Base de datos no inicializa

```bash
# Verificar logs de PostgreSQL
kubectl logs -f -l app=postgres -n mef

# Verificar PVC
kubectl get pvc -n mef

# Si es necesario, eliminar el PVC y volver a crear
kubectl delete pvc postgres-pvc -n mef
kubectl apply -f k8s/postgres-pvc.yaml
```

## Actualizaciones

Para actualizar la aplicación:

```bash
# 1. Reconstruir las imágenes con nuevo tag
docker build -t mef-backend:v2 ./backend

# 2. Actualizar el deployment
kubectl set image deployment/backend backend=mef-backend:v2 -n mef

# 3. Verificar el rollout
kubectl rollout status deployment/backend -n mef

# 4. Si hay problemas, hacer rollback
kubectl rollout undo deployment/backend -n mef
```

## Producción

Para un deployment en producción, considera:

1. **Ingress Controller**: Usar Nginx Ingress o Traefik en lugar de NodePort
2. **TLS/SSL**: Configurar certificados SSL (Let's Encrypt con cert-manager)
3. **Secrets Management**: Usar herramientas como Sealed Secrets o External Secrets Operator
4. **Monitoring**: Implementar Prometheus + Grafana
5. **Logging**: Configurar un stack EFK (Elasticsearch, Fluentd, Kibana)
6. **Backup**: Configurar backups automáticos de la base de datos
7. **High Availability**: Usar múltiples réplicas y PodDisruptionBudgets
8. **Auto-scaling**: Configurar Horizontal Pod Autoscaler (HPA)
9. **Resource Quotas**: Implementar límites a nivel de namespace

## Soporte

Para problemas o preguntas:

1. Revisa los logs: `kubectl logs -f <pod-name> -n mef`
2. Verifica los eventos: `kubectl get events -n mef`
3. Consulta la documentación de Kubernetes: https://kubernetes.io/docs/
