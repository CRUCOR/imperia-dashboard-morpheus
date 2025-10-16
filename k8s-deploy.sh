#!/bin/bash

# Script para desplegar la aplicación MEF Dashboard en Kubernetes
# Autor: Claude Code
# Fecha: $(date +%Y-%m-%d)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si kubectl está instalado
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl no está instalado. Por favor instálalo antes de continuar."
        exit 1
    fi
    print_success "kubectl encontrado"
}

# Función para verificar si docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "docker no está instalado. Por favor instálalo antes de continuar."
        exit 1
    fi
    print_success "docker encontrado"
}

# Función para verificar la conexión al cluster de Kubernetes
check_k8s_connection() {
    print_info "Verificando conexión al cluster de Kubernetes..."
    if ! kubectl cluster-info &> /dev/null; then
        print_error "No se puede conectar al cluster de Kubernetes"
        print_info "Asegúrate de que tu cluster esté corriendo (minikube, k3s, etc.)"
        exit 1
    fi
    print_success "Conexión al cluster establecida"
}

# Función para construir las imágenes Docker
build_images() {
    print_info "Construyendo imágenes Docker..."

    # Backend
    print_info "Construyendo imagen del backend..."
    docker build -t mef-backend:latest ./backend
    print_success "Imagen del backend construida"

    # Frontend
    print_info "Construyendo imagen del frontend..."
    docker build -t mef-frontend:latest ./frontend
    print_success "Imagen del frontend construida"

    # Morpheus/Triton
    print_info "Construyendo imagen de Morpheus/Triton..."
    docker build -t mef-morpheus:latest ./morpheus-triton
    print_success "Imagen de Morpheus/Triton construida"
}

# Función para cargar imágenes en minikube (si aplica)
load_images_to_minikube() {
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        print_info "Detectado Minikube, cargando imágenes..."
        minikube image load mef-backend:latest
        minikube image load mef-frontend:latest
        minikube image load mef-morpheus:latest
        print_success "Imágenes cargadas en Minikube"
    fi
}

# Función para aplicar manifiestos de Kubernetes
apply_manifests() {
    print_info "Aplicando manifiestos de Kubernetes..."

    # Namespace
    print_info "Creando namespace..."
    kubectl apply -f k8s/namespace.yaml
    print_success "Namespace creado"

    # ConfigMap y Secrets
    print_info "Aplicando ConfigMap y Secrets..."
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    print_success "ConfigMap y Secrets aplicados"

    # PVC
    print_info "Creando PersistentVolumeClaim para PostgreSQL..."
    kubectl apply -f k8s/postgres-pvc.yaml
    print_success "PVC creado"

    # PostgreSQL
    print_info "Desplegando PostgreSQL..."
    kubectl apply -f k8s/postgres-deployment.yaml
    kubectl apply -f k8s/postgres-service.yaml
    print_success "PostgreSQL desplegado"

    # Morpheus/Triton
    print_info "Desplegando Morpheus/Triton..."
    kubectl apply -f k8s/morpheus-triton-deployment.yaml
    kubectl apply -f k8s/morpheus-triton-service.yaml
    print_success "Morpheus/Triton desplegado"

    # Backend
    print_info "Desplegando Backend..."
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/backend-service.yaml
    print_success "Backend desplegado"

    # Frontend
    print_info "Desplegando Frontend..."
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/frontend-service.yaml
    print_success "Frontend desplegado"
}

# Función para esperar a que los pods estén listos
wait_for_pods() {
    print_info "Esperando a que los pods estén listos..."

    print_info "Esperando PostgreSQL..."
    kubectl wait --for=condition=ready pod -l app=postgres -n mef --timeout=300s || print_warning "PostgreSQL tardó más de lo esperado"

    print_info "Esperando Morpheus/Triton..."
    kubectl wait --for=condition=ready pod -l app=morpheus-triton -n mef --timeout=300s || print_warning "Morpheus/Triton tardó más de lo esperado"

    print_info "Esperando Backend..."
    kubectl wait --for=condition=ready pod -l app=backend -n mef --timeout=300s || print_warning "Backend tardó más de lo esperado"

    print_info "Esperando Frontend..."
    kubectl wait --for=condition=ready pod -l app=frontend -n mef --timeout=300s || print_warning "Frontend tardó más de lo esperado"

    print_success "Todos los pods están listos"
}

# Función para mostrar el estado final
show_status() {
    print_info "Estado del deployment:"
    echo ""
    kubectl get all -n mef
    echo ""

    print_info "Servicios disponibles:"
    kubectl get svc -n mef
    echo ""

    # Obtener la URL del frontend
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        FRONTEND_URL=$(minikube service frontend-service -n mef --url)
        print_success "Frontend disponible en: ${FRONTEND_URL}"
    else
        NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
        print_success "Frontend disponible en: http://${NODE_IP}:30080"
    fi
}

# Función principal
main() {
    echo ""
    print_info "=========================================="
    print_info "MEF Dashboard - Deployment a Kubernetes"
    print_info "=========================================="
    echo ""

    # Verificaciones previas
    check_kubectl
    check_docker
    check_k8s_connection

    # Preguntar si construir imágenes
    echo ""
    read -p "¿Deseas construir las imágenes Docker? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        build_images
        load_images_to_minikube
    else
        print_warning "Saltando construcción de imágenes. Asegúrate de que las imágenes existan."
    fi

    # Aplicar manifiestos
    echo ""
    apply_manifests

    # Esperar a que los pods estén listos
    echo ""
    wait_for_pods

    # Mostrar estado final
    echo ""
    show_status

    echo ""
    print_success "=========================================="
    print_success "Deployment completado exitosamente!"
    print_success "=========================================="
    echo ""

    print_info "Comandos útiles:"
    echo "  - Ver logs del backend: kubectl logs -f -l app=backend -n mef"
    echo "  - Ver logs del frontend: kubectl logs -f -l app=frontend -n mef"
    echo "  - Ver logs de Morpheus: kubectl logs -f -l app=morpheus-triton -n mef"
    echo "  - Ver logs de PostgreSQL: kubectl logs -f -l app=postgres -n mef"
    echo "  - Escalar el backend: kubectl scale deployment backend --replicas=3 -n mef"
    echo "  - Ver todos los recursos: kubectl get all -n mef"
    echo ""
}

# Ejecutar función principal
main
