.PHONY: help build-all deploy clean logs status test

help:
	@echo "Comandos disponibles:"
	@echo "  make build-all     - Construir todas las imágenes Docker"
	@echo "  make load-images   - Cargar imágenes en minikube"
	@echo "  make deploy        - Desplegar en Kubernetes"
	@echo "  make clean         - Limpiar deployment"
	@echo "  make logs          - Ver logs de todos los servicios"
	@echo "  make status        - Ver estado del cluster"
	@echo "  make test          - Ejecutar pruebas básicas"
	@echo "  make port-forward  - Crear port-forwards para todos los servicios"

build-all:
	@echo "Construyendo backend..."
	cd backend && docker build -t imperia-backend:latest .
	@echo "Construyendo morpheus-triton..."
	cd morpheus-triton && docker build -t morpheus-triton:latest .
	@echo "Construyendo frontend..."
	cd frontend && docker build -t imperia-frontend:latest .
	@echo "Todas las imágenes construidas exitosamente!"

load-images:
	@echo "Cargando imágenes en minikube..."
	minikube image load imperia-backend:latest
	minikube image load morpheus-triton:latest
	minikube image load imperia-frontend:latest
	@echo "Imágenes cargadas exitosamente!"

deploy:
	@echo "Desplegando en Kubernetes..."
	kubectl apply -f k8s/base/
	@echo "Esperando a que los pods estén listos..."
	kubectl wait --for=condition=ready pod -l app=postgres -n ai-platform --timeout=120s
	kubectl wait --for=condition=ready pod -l app=backend -n ai-platform --timeout=120s
	kubectl wait --for=condition=ready pod -l app=morpheus-triton -n ai-platform --timeout=120s
	kubectl wait --for=condition=ready pod -l app=frontend -n ai-platform --timeout=120s
	@echo "Deployment completado!"

clean:
	@echo "Limpiando deployment..."
	kubectl delete namespace ai-platform --ignore-not-found=true
	@echo "Limpieza completada!"

logs:
	@echo "=== BACKEND LOGS ==="
	kubectl logs -n ai-platform -l app=backend --tail=50
	@echo "\n=== MORPHEUS LOGS ==="
	kubectl logs -n ai-platform -l app=morpheus-triton --tail=50
	@echo "\n=== POSTGRES LOGS ==="
	kubectl logs -n ai-platform -l app=postgres --tail=50

status:
	@echo "=== NAMESPACE ==="
	kubectl get ns ai-platform
	@echo "\n=== PODS ==="
	kubectl get pods -n ai-platform -o wide
	@echo "\n=== SERVICES ==="
	kubectl get svc -n ai-platform
	@echo "\n=== PVC ==="
	kubectl get pvc -n ai-platform

test:
	@echo "Ejecutando pruebas básicas..."
	@echo "\n1. Health check backend..."
	kubectl exec -n ai-platform deployment/backend -- curl -s http://localhost:3000/health
	@echo "\n2. Health check morpheus..."
	kubectl exec -n ai-platform deployment/morpheus-triton -- curl -s http://localhost:8000/health
	@echo "\n3. Verificar conectividad backend -> morpheus..."
	kubectl exec -n ai-platform deployment/backend -- curl -s http://morpheus-triton-service:8000/health
	@echo "\n4. Verificar conectividad backend -> postgres..."
	kubectl exec -n ai-platform deployment/backend -- node -e "require('pg').Pool({host:'postgres-service',port:5432,database:'imperia_db',user:'imperia_user',password:'imperia_password'}).query('SELECT 1').then(()=>console.log('OK')).catch(e=>console.error('FAIL',e.message))"
	@echo "\nPruebas completadas!"

port-forward:
	@echo "Creando port-forwards..."
	@echo "Frontend: http://localhost:8080"
	@echo "Backend: http://localhost:3000"
	@echo "Morpheus: http://localhost:8000"
	@echo "Presiona Ctrl+C para detener"
	kubectl port-forward -n ai-platform svc/frontend-service 8080:80 & \
	kubectl port-forward -n ai-platform svc/backend-service 3000:3000 & \
	kubectl port-forward -n ai-platform svc/morpheus-triton-service 8000:8000 & \
	wait
