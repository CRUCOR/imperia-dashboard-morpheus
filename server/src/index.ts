import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fs from 'fs/promises'
import path from 'path'

import { config } from '@/config'
import { logger } from '@/utils/logger'

// Repositories
import { InMemoryJobRepository } from '@/repositories/JobRepository'
import { LocalFileRepository } from '@/repositories/FileRepository'

// Services
import { MorpheusService } from '@/services/MorpheusService'
import { CsvService } from '@/services/CsvService'
import { ProcessingService } from '@/services/ProcessingService'

// Controllers
import { FileController } from '@/controllers/FileController'
import { ModelController } from '@/controllers/ModelController'
import { ProcessingController } from '@/controllers/ProcessingController'

// Middleware
import { uploadMiddleware, handleUploadError } from '@/middleware/upload'
import {
  validateProcessingRequest,
  validateJobId,
  validateModelParameters
} from '@/middleware/validation'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors(config.cors))

// Rate limiting
const limiter = rateLimit(config.rateLimit)
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })
  next()
})

// Initialize dependencies using Dependency Injection
const jobRepository = new InMemoryJobRepository()
const fileRepository = new LocalFileRepository()
const morpheusService = new MorpheusService()
const csvService = new CsvService()
const processingService = new ProcessingService(jobRepository, morpheusService, csvService)

// Initialize controllers
const fileController = new FileController(fileRepository)
const modelController = new ModelController(morpheusService)
const processingController = new ProcessingController(processingService)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  })
})

// API Routes

// File upload routes
app.post('/api/files/upload',
  uploadMiddleware,
  handleUploadError,
  fileController.uploadFile
)
app.get('/api/files/:fileId', fileController.getFile)
app.delete('/api/files/:fileId', fileController.deleteFile)

// Model routes
app.get('/api/models', modelController.getModels)
app.get('/api/models/:modelId', modelController.getModel)
app.get('/api/models/:modelId/validate', modelController.validateModel)

// Processing routes
app.post('/api/process',
  validateProcessingRequest,
  validateModelParameters,
  processingController.processFile
)
app.get('/api/jobs', processingController.getAllJobs)
app.get('/api/jobs/:jobId', validateJobId, processingController.getJob)
app.post('/api/jobs/:jobId/cancel', validateJobId, processingController.cancelJob)
app.get('/api/jobs/:jobId/download', validateJobId, processingController.downloadResult)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  })

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(config.nodeEnv === 'development' && { details: err.message }),
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

// Initialize server
async function startServer() {
  try {
    // Ensure required directories exist
    await Promise.all([
      fs.mkdir(config.upload.uploadPath, { recursive: true }),
      fs.mkdir(config.upload.outputPath, { recursive: true }),
      fs.mkdir('logs', { recursive: true }),
    ])

    app.listen(config.port, '0.0.0.0', () => {
      logger.info('Server started successfully', {
        port: config.port,
        nodeEnv: config.nodeEnv,
        uploadPath: config.upload.uploadPath,
        outputPath: config.upload.outputPath,
      })
    })
  } catch (error) {
    logger.error('Failed to start server', { error })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start the server
startServer()

export default app