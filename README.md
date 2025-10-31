# Imperia Dashboard - Morpheus Integration

Dashboard de análisis de seguridad que se integra con [NVIDIA Morpheus](https://docs.nvidia.com/morpheus/) para análisis de ciberseguridad avanzado.

## Descripción

Este proyecto proporciona un dashboard web para gestionar y visualizar análisis de seguridad realizados por una instancia externa de NVIDIA Morpheus Server. El sistema está compuesto por:

- **Frontend**: Interfaz web para visualización y gestión
- **Backend API**: API REST en Node.js/TypeScript con TypeORM
- **PostgreSQL**: Base de datos para almacenamiento de análisis y resultados
- **Morpheus Server (Externo)**: Instancia externa de NVIDIA Morpheus para procesamiento ML

## Arquitectura

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  Frontend   │─────▶│  Backend    │─────▶│  PostgreSQL  │
│  (React)    │      │  (Node.js)  │      │  (Database)  │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            ▼
                     ┌─────────────────┐
                     │ Morpheus Server │
                     │   (External)    │
                     └─────────────────┘
```

## Requisitos Previos

- Docker y Docker Compose
- Una instancia de NVIDIA Morpheus Server accesible externamente
- (Opcional) GPU NVIDIA con drivers CUDA para mejor rendimiento del Morpheus Server

## Configuración de Morpheus Server Externo

Este dashboard requiere una instancia de NVIDIA Morpheus Server que exponga los siguientes endpoints HTTP:

### Endpoints Requeridos

#### 1. Health Check
```
GET /health
Response: { "status": "healthy", "timestamp": <unix_timestamp> }
```

#### 2. Metrics
```
GET /metrics
Response: {
  "gpu_usage": <number>,
  "cpu_usage": <number>,
  "throughput": <number>
}
```

#### 3. Prediction/Analysis
```
POST /predict
Content-Type: multipart/form-data

Form Fields:
  - file: <binary_data> (archivo de datos en formato jsonlines)
  - model_name: <string> (ej: "cryptomining", "phishing", etc.)
  - analysisId: <string> (ID único del análisis)
  - [model-specific parameters]

Response: {
  "analysisId": <string>,
  "model": <string>,
  "num_rows": <number>,
  "threats_detected": <number>,
  "metadata": { ... }
}
```

### Modelos Soportados

El Morpheus Server debe implementar al menos uno de los siguientes modelos:

- `digital-fingerprint`: Generación de hashes y detección de duplicados
- `sensitive-info`: Detección de PII, credenciales, API keys
- `cryptomining`: Detección de minería de criptomonedas (ABP)
- `phishing`: Detección de intentos de phishing
- `fraud-detection`: Detección de fraude e identidad robada
- `ransomware`: Detección de ransomware

## Configuración

### 1. Variables de Entorno

Copia el archivo `.env` de ejemplo y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` y configura la URL de tu Morpheus Server:

```env
# External Morpheus Server
MORPHEUS_SERVICE_URL=http://your-morpheus-server:8000

# Database
DB_USER=imperia_user
DB_PASSWORD=imperia_password
DB_NAME=imperia_db
```

### 2. Configuración del Backend

El backend también necesita su propio archivo de entorno:

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env`:

```env
MORPHEUS_SERVICE_URL=http://your-morpheus-server:8000
DB_HOST=postgres
DB_NAME=imperia_db
```

## Instalación y Ejecución

### Usando Docker Compose (Recomendado)

1. Construye e inicia los servicios:

```bash
docker-compose up -d
```

2. Los servicios estarán disponibles en:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432

3. Para ver los logs:

```bash
docker-compose logs -f
```

4. Para detener los servicios:

```bash
docker-compose down
```

### Desarrollo Local

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estructura del Proyecto

```
imperia-dashboard-morpheus/
├── backend/              # API REST en Node.js/TypeScript
│   ├── src/
│   │   ├── config/      # Configuración
│   │   ├── models/      # Modelos TypeORM
│   │   ├── routes/      # Rutas de la API
│   │   ├── services/    # Lógica de negocio
│   │   └── index.ts     # Punto de entrada
│   ├── Dockerfile
│   └── package.json
├── frontend/             # Interfaz web
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── postgres/            # Scripts de inicialización de DB
│   └── init/
├── docker-compose.yml   # Orquestación de servicios
├── .env                 # Variables de entorno
└── README.md           # Este archivo
```

## API Endpoints

### Backend API

#### Health Check
```
GET /health
```

#### Analysis Management
```
POST /api/analysis/start          # Iniciar nuevo análisis
GET /api/analysis/:id             # Obtener estado del análisis
GET /api/analysis                 # Listar todos los análisis
DELETE /api/analysis/:id          # Eliminar análisis
```

#### Monitoring
```
GET /api/monitoring/metrics       # Obtener métricas del sistema
GET /api/monitoring/health        # Estado del Morpheus Server
```

## Integración con Morpheus

### Flujo de Análisis

1. El usuario sube un archivo de datos a través del frontend
2. El backend crea un registro de análisis en PostgreSQL
3. El backend envía el archivo al Morpheus Server externo vía `/predict`
4. Morpheus procesa los datos y devuelve los resultados
5. El backend actualiza el registro con los resultados
6. El frontend muestra los resultados al usuario

### Formato de Datos

Los archivos de entrada deben estar en formato **JSONL** (JSON Lines):

```jsonl
{"field1": "value1", "field2": "value2"}
{"field1": "value3", "field2": "value4"}
```

## Troubleshooting

### Error: Cannot connect to Morpheus service

Verifica que:
1. Tu Morpheus Server está ejecutándose y accesible
2. La URL configurada en `MORPHEUS_SERVICE_URL` es correcta
3. No hay firewalls bloqueando la conexión
4. El endpoint `/health` responde correctamente

### Error: Database connection failed

Verifica que:
1. PostgreSQL está ejecutándose
2. Las credenciales en `.env` son correctas
3. El puerto 5432 no está siendo usado por otra aplicación

## Documentación Adicional

- [NVIDIA Morpheus Documentation](https://docs.nvidia.com/morpheus/)
- [NVIDIA Morpheus GitHub](https://github.com/nv-morpheus/Morpheus)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Licencia

Este proyecto es parte del sistema Imperia.

## Notas Importantes

Este repositorio **NO** incluye una instancia de Morpheus Server. Debes configurar y mantener tu propia instancia de Morpheus Server externamente y apuntar a ella mediante la variable `MORPHEUS_SERVICE_URL`.

Para obtener información sobre cómo desplegar Morpheus Server, consulta la [documentación oficial de NVIDIA Morpheus](https://docs.nvidia.com/morpheus/getting_started.html).
