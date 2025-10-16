#!/bin/bash

# Script para apagar/eliminar la aplicación MEF Dashboard de Kubernetes
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
        print_error "kubectl no está instalado."
        exit 1
    fi
    print_success "kubectl encontrado"
}

# Función para verificar la conexión al cluster de Kubernetes
check_k8s_connection() {
    print_info "Verificando conexión al cluster de Kubernetes..."
    if ! kubectl cluster-info &> /dev/null; then
        print_error "No se puede conectar al cluster de Kubernetes"
        exit 1
    fi
    print_success "Conexión al cluster establecida"
}

# Función para verificar si el namespace existe
check_namespace() {
    if ! kubectl get namespace mef &> /dev/null; then
        print_warning "El namespace 'mef' no existe. No hay nada que eliminar."
        exit 0
    fi
}

# Función para mostrar el estado actual
show_current_status() {
    print_info "Estado actual de los recursos en el namespace 'mef':"
    echo ""
    kubectl get all -n mef 2>/dev/null || print_warning "No hay recursos en el namespace"
    echo ""
}

# Función para eliminar deployments
delete_deployments() {
    print_info "Eliminando deployments..."

    if kubectl get deployment frontend -n mef &> /dev/null; then
        kubectl delete -f k8s/frontend-deployment.yaml --grace-period=30 --timeout=60s 2>/dev/null || print_warning "No se pudo eliminar frontend deployment"
    fi

    if kubectl get deployment backend -n mef &> /dev/null; then
        kubectl delete -f k8s/backend-deployment.yaml --grace-period=30 --timeout=60s 2>/dev/null || print_warning "No se pudo eliminar backend deployment"
    fi

    if kubectl get deployment morpheus-triton -n mef &> /dev/null; then
        kubectl delete -f k8s/morpheus-triton-deployment.yaml --grace-period=30 --timeout=60s 2>/dev/null || print_warning "No se pudo eliminar morpheus-triton deployment"
    fi

    if kubectl get deployment postgres -n mef &> /dev/null; then
        kubectl delete -f k8s/postgres-deployment.yaml --grace-period=30 --timeout=60s 2>/dev/null || print_warning "No se pudo eliminar postgres deployment"
    fi

    print_success "Deployments eliminados"
}

# Función para eliminar services
delete_services() {
    print_info "Eliminando services..."

    kubectl delete -f k8s/frontend-service.yaml 2>/dev/null || print_warning "No se pudo eliminar frontend service"
    kubectl delete -f k8s/backend-service.yaml 2>/dev/null || print_warning "No se pudo eliminar backend service"
    kubectl delete -f k8s/morpheus-triton-service.yaml 2>/dev/null || print_warning "No se pudo eliminar morpheus-triton service"
    kubectl delete -f k8s/postgres-service.yaml 2>/dev/null || print_warning "No se pudo eliminar postgres service"

    print_success "Services eliminados"
}

# Función para eliminar PVCs y datos
delete_storage() {
    print_info "Eliminando PersistentVolumeClaims..."

    echo ""
    print_warning "ATENCIÓN: Esto eliminará todos los datos de la base de datos."
    read -p "¿Estás seguro de que quieres eliminar los datos? (s/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        kubectl delete -f k8s/postgres-pvc.yaml 2>/dev/null || print_warning "No se pudo eliminar PVC"
        print_success "PVC eliminado"
    else
        print_info "Manteniendo PVC y datos. Se puede reutilizar en el próximo deployment."
    fi
}

# Función para eliminar ConfigMap y Secrets
delete_configs() {
    print_info "Eliminando ConfigMap y Secrets..."

    kubectl delete -f k8s/configmap.yaml 2>/dev/null || print_warning "No se pudo eliminar ConfigMap"
    kubectl delete -f k8s/secrets.yaml 2>/dev/null || print_warning "No se pudo eliminar Secrets"

    print_success "ConfigMap y Secrets eliminados"
}

# Función para eliminar namespace
delete_namespace() {
    print_info "Eliminando namespace..."

    echo ""
    read -p "¿Deseas eliminar el namespace 'mef'? (s/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        kubectl delete namespace mef --grace-period=60 --timeout=120s
        print_success "Namespace eliminado"
    else
        print_info "Namespace mantenido"
    fi
}

# Función para limpiar imágenes Docker locales (opcional)
cleanup_images() {
    echo ""
    read -p "¿Deseas eliminar las imágenes Docker locales? (s/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        print_info "Eliminando imágenes Docker locales..."

        docker rmi mef-frontend:latest 2>/dev/null || print_warning "No se pudo eliminar imagen frontend"
        docker rmi mef-backend:latest 2>/dev/null || print_warning "No se pudo eliminar imagen backend"
        docker rmi mef-morpheus:latest 2>/dev/null || print_warning "No se pudo eliminar imagen morpheus"

        print_success "Imágenes Docker eliminadas"
    else
        print_info "Imágenes Docker mantenidas"
    fi
}

# Función para verificar que todo fue eliminado
verify_cleanup() {
    print_info "Verificando limpieza..."

    if kubectl get namespace mef &> /dev/null; then
        echo ""
        print_info "Recursos restantes en el namespace 'mef':"
        kubectl get all -n mef 2>/dev/null || print_success "Namespace vacío"
    else
        print_success "Namespace 'mef' eliminado completamente"
    fi
}

# Función principal
main() {
    echo ""
    print_info "=========================================="
    print_info "MEF Dashboard - Shutdown de Kubernetes"
    print_info "=========================================="
    echo ""

    # Verificaciones previas
    check_kubectl
    check_k8s_connection
    check_namespace

    # Mostrar estado actual
    show_current_status

    # Confirmación final
    echo ""
    print_warning "Este script eliminará todos los recursos de MEF Dashboard del cluster."
    read -p "¿Estás seguro de que quieres continuar? (s/n): " -n 1 -r
    echo ""
    echo ""

    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        print_info "Operación cancelada."
        exit 0
    fi

    # Eliminar recursos en orden
    delete_deployments
    echo ""

    delete_services
    echo ""

    delete_storage
    echo ""

    delete_configs
    echo ""

    delete_namespace
    echo ""

    cleanup_images
    echo ""

    # Verificar limpieza
    verify_cleanup

    echo ""
    print_success "=========================================="
    print_success "Shutdown completado!"
    print_success "=========================================="
    echo ""

    print_info "Si necesitas volver a desplegar la aplicación, ejecuta:"
    echo "  ./k8s-deploy.sh"
    echo ""
}

# Ejecutar función principal
main
