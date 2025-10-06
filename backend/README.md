# Backend Service - Imperia Dashboard Morpheus

Backend API for medical image analysis platform using Node.js, Express, and PostgreSQL.

## Architecture

The backend follows a **layered architecture** pattern with clear separation of concerns:

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # PostgreSQL connection pool
│   │   ├── swagger.ts    # OpenAPI/Swagger configuration
│   │   └── index.ts      # Centralized config exports
│   ├── models/           # Data models and interfaces
│   │   ├── analysis.model.ts
│   │   ├── service.model.ts
│   │   └── index.ts
│   ├── services/         # Business logic layer
│   │   ├── analysis.service.ts      # Analysis operations
│   │   ├── database.service.ts      # Database operations
│   │   ├── morpheus.service.ts      # Morpheus/Triton communication
│   │   ├── monitoring.service.ts    # System monitoring
│   │   └── index.ts
│   ├── controllers/      # HTTP request handlers
│   │   ├── analysis.controller.ts
│   │   ├── monitoring.controller.ts
│   │   └── index.ts
│   ├── routes/           # API route definitions
│   │   ├── analysis.routes.ts
│   │   ├── monitoring.routes.ts
│   │   └── index.ts
│   ├── middleware/       # Express middleware
│   │   ├── upload.middleware.ts    # File upload (multer)
│   │   └── error.middleware.ts     # Error handling
│   └── index.ts          # Application entry point
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Layers Explanation

### 1. **Models Layer** (`src/models/`)
Defines TypeScript interfaces and types for data structures.

**Responsibilities:**
- Type definitions for requests/responses
- Database entity interfaces
- Data validation schemas

**Examples:**
- `Analysis`: Database entity structure
- `AnalysisResponse`: API response format
- `CreateAnalysisRequest`: Request payload structure

### 2. **Services Layer** (`src/services/`)
Contains business logic and external service interactions.

**Responsibilities:**
- Business rules and algorithms
- Database operations
- External API calls (Morpheus/Triton)
- Data transformation

**Services:**
- `analysisService`: Analysis creation and processing logic
- `databaseService`: All database CRUD operations
- `morpheusService`: Communication with ML model service
- `monitoringService`: System health and metrics

### 3. **Controllers Layer** (`src/controllers/`)
Handles HTTP requests and responses.

**Responsibilities:**
- Request validation
- Calling appropriate services
- Response formatting
- HTTP status codes
- Error handling

**Controllers:**
- `analysisController`: Handles /analyze, /results, /metrics/:id
- `monitoringController`: Handles /health, /status, /metrics/global

### 4. **Routes Layer** (`src/routes/`)
Defines API endpoints and maps them to controllers.

**Responsibilities:**
- URL path definitions
- HTTP method mappings
- Middleware attachment (authentication, file upload)
- OpenAPI/Swagger documentation annotations

### 5. **Middleware Layer** (`src/middleware/`)
Reusable middleware functions.

**Responsibilities:**
- File upload handling
- Error handling
- Request logging
- Authentication (future)

### 6. **Config Layer** (`src/config/`)
Application configuration and setup.

**Responsibilities:**
- Environment variables
- Database connection
- External service URLs
- Swagger/OpenAPI setup

## API Endpoints

### Analysis Endpoints

#### POST /analyze
Upload and analyze a medical image.

**Request:**
```bash
curl -X POST http://localhost:3000/analyze \
  -F "file=@image.jpg" \
  -F "modelName=abp" \
  -F "parameters={\"threshold\":0.5}"
```

**Response (202 Accepted):**
```json
{
  "analysisId": "analysis_1728168000_abc123",
  "status": "processing",
  "message": "Analysis started successfully"
}
```

#### GET /results/:analysisId
Get analysis results.

**Request:**
```bash
curl http://localhost:3000/results/analysis_1728168000_abc123
```

**Response (200 OK):**
```json
{
  "analysisId": "analysis_1728168000_abc123",
  "modelName": "abp",
  "status": "completed",
  "result": {
    "predictions": [
      {
        "class": "benign",
        "confidence": 0.92,
        "bounding_box": { "x": 150, "y": 200, "width": 80, "height": 90 }
      }
    ],
    "metadata": {
      "file_name": "mammogram.jpg",
      "processing_time_sec": 3.5
    }
  },
  "duration_ms": 3500,
  "created_at": "2025-10-05T10:00:00.000Z",
  "completed_at": "2025-10-05T10:00:03.500Z"
}
```

#### GET /metrics/:analysisId
Get metrics collected during analysis.

**Request:**
```bash
curl http://localhost:3000/metrics/analysis_1728168000_abc123
```

**Response (200 OK):**
```json
{
  "analysisId": "analysis_1728168000_abc123",
  "metrics": [
    {
      "id": 1,
      "gpu_usage": 75.2,
      "gpu_mem_mb": 4096.5,
      "cpu_usage": 45.3,
      "ram_mb": 2048.7,
      "duration_ms": 0,
      "throughput": 125.4,
      "timestamp": "2025-10-05T10:00:00.000Z"
    }
  ]
}
```

### Monitoring Endpoints

#### GET /health
Health check.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "backend",
  "timestamp": "2025-10-05T10:00:00.000Z"
}
```

#### GET /status
Status of all services.

**Response (200 OK):**
```json
{
  "backend": {
    "status": "healthy",
    "timestamp": "2025-10-05T10:00:00.000Z"
  },
  "postgres": {
    "status": "healthy"
  },
  "morpheus": {
    "status": "healthy",
    "model_loaded": true,
    "gpu_available": false
  }
}
```

#### GET /metrics/global
Global system metrics.

**Response (200 OK):**
```json
{
  "gpu_usage": 45.2,
  "gpu_mem_mb": 3072.5,
  "cpu_usage": 32.8,
  "ram_mb": 4096.2,
  "services": { /* service status */ },
  "timestamp": "2025-10-05T10:00:00.000Z"
}
```

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- Complete API reference
- Request/response examples
- Try-it-out functionality
- Schema definitions

## Development

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

## Environment Variables

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=imperia_db
DB_USER=imperia_user
DB_PASSWORD=imperia_password

# Morpheus/Triton Service
MORPHEUS_SERVICE_URL=http://localhost:8000
```

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Check services status
curl http://localhost:3000/status

# Upload and analyze
curl -X POST http://localhost:3000/analyze \
  -F "file=@test.jpg" \
  -F "modelName=abp"

# Get results (use analysisId from previous response)
curl http://localhost:3000/results/analysis_1728168000_abc123
```

## Database Schema

The backend uses the following PostgreSQL tables:

- **analyses**: Main analysis records
- **analysis_metrics**: Metrics collected every 5s during processing
- **global_metrics**: System-wide metrics

See `postgres/init/01-init-db.sql` for schema details.

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Successful GET request
- `202 Accepted`: Analysis started (async operation)
- `400 Bad Request`: Invalid request (missing file, invalid params)
- `404 Not Found`: Analysis not found
- `413 Payload Too Large`: File exceeds 100MB limit
- `500 Internal Server Error`: Server error

Error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Best Practices

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Dependency Injection**: Services are injected into controllers
3. **Type Safety**: Full TypeScript type coverage
4. **Error Handling**: Centralized error handling middleware
5. **Documentation**: Comprehensive Swagger/OpenAPI docs
6. **Async Processing**: Long-running tasks processed in background
7. **Resource Cleanup**: Graceful shutdown handlers

## Contributing

When adding new features:

1. Add model interfaces in `src/models/`
2. Implement business logic in `src/services/`
3. Create controller methods in `src/controllers/`
4. Define routes with Swagger docs in `src/routes/`
5. Update this README if needed

## License

MIT
