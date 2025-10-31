.PHONY: help build up down restart logs status test clean

help:
	@echo "Comandos disponibles:"
	@echo "  make build    - Construir todas las imágenes Docker"
	@echo "  make up       - Iniciar todos los servicios"
	@echo "  make down     - Detener todos los servicios"
	@echo "  make restart  - Reiniciar todos los servicios"
	@echo "  make logs     - Ver logs de todos los servicios"
	@echo "  make status   - Ver estado de los contenedores"
	@echo "  make test     - Ejecutar pruebas de conectividad"
	@echo "  make clean    - Limpiar contenedores y volúmenes"

build:
	@echo "Construyendo todas las imágenes..."
	docker-compose build
	@echo "Imágenes construidas exitosamente!"

up:
	@echo "Iniciando servicios..."
	docker-compose up -d
	@echo "Servicios iniciados!"
	@echo "Frontend: http://localhost:8080"
	@echo "Backend: http://localhost:3000"
	@echo "PostgreSQL: localhost:5432"

down:
	@echo "Deteniendo servicios..."
	docker-compose down
	@echo "Servicios detenidos!"

restart:
	@echo "Reiniciando servicios..."
	docker-compose restart
	@echo "Servicios reiniciados!"

logs:
	@echo "Mostrando logs (Ctrl+C para salir)..."
	docker-compose logs -f

status:
	@echo "=== ESTADO DE CONTENEDORES ==="
	docker-compose ps
	@echo ""
	@echo "=== REDES ==="
	docker network ls | grep imperia
	@echo ""
	@echo "=== VOLÚMENES ==="
	docker volume ls | grep imperia

test:
	@echo "Ejecutando pruebas de conectividad..."
	@echo "\n1. Health check backend..."
	@curl -s http://localhost:3000/health || echo "Backend no disponible"
	@echo "\n2. Verificar PostgreSQL..."
	@docker-compose exec -T postgres pg_isready -U imperia_user || echo "PostgreSQL no disponible"
	@echo "\n3. Verificar conectividad backend -> postgres..."
	@docker-compose exec -T backend node -e "require('pg').Pool({host:'postgres',port:5432,database:'imperia_db',user:'imperia_user',password:'imperia_password'}).query('SELECT 1').then(()=>console.log('OK')).catch(e=>console.error('FAIL',e.message))" || echo "Error"
	@echo "\nPruebas completadas!"

clean:
	@echo "Limpiando contenedores, volúmenes y redes..."
	docker-compose down -v
	@echo "Limpieza completada!"
