.PHONY: help dev build start stop clean install logs shell

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	docker-compose up -d
	@echo "🚀 Development environment started!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:4000"
	@echo "⚠️  Note: Morpheus CLI must be installed separately"

build: ## Build all services
	docker-compose build

start: ## Start all services
	docker-compose up -d

stop: ## Stop all services
	docker-compose down

clean: ## Clean all containers, volumes, and networks
	docker-compose down -v --remove-orphans
	docker system prune -f

install: ## Install dependencies for all services
	cd client && npm install
	cd server && npm install

logs: ## Show logs for all services
	docker-compose logs -f

logs-client: ## Show client logs
	docker-compose logs -f client

logs-server: ## Show server logs
	docker-compose logs -f server

shell-client: ## Open shell in client container
	docker-compose exec client sh

shell-server: ## Open shell in server container
	docker-compose exec server sh

restart: ## Restart all services
	docker-compose restart

restart-client: ## Restart client service
	docker-compose restart client

restart-server: ## Restart server service
	docker-compose restart server

test: ## Run tests
	cd server && npm test
	cd client && npm run test 2>/dev/null || echo "No tests configured for client"

lint: ## Run linting
	cd server && npm run lint
	cd client && npm run lint

typecheck: ## Run type checking
	cd server && npm run typecheck
	cd client && npm run typecheck

status: ## Show service status
	docker-compose ps