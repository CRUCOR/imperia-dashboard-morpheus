/**
 * Swagger Configuration
 * OpenAPI documentation setup
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Imperia Dashboard Morpheus API',
      version: '1.0.0',
      description: `
Backend API for the Imperia Dashboard Morpheus platform - AI-powered medical image analysis using ABP (Automated Breast Pathology) models.

## Features

- **Image Analysis**: Upload medical images for automated analysis using ML models
- **Real-time Metrics**: Monitor GPU, CPU, and RAM usage during analysis
- **Service Health**: Check the status of all platform services
- **Results Tracking**: Retrieve analysis results and historical metrics

## Workflow

1. **Upload Image**: POST /analyze with an image file
2. **Processing**: The system processes the image using the ABP model
3. **Metrics Collection**: System metrics are collected every 5 seconds during processing
4. **Results**: Retrieve results using GET /results/{analysisId}

## Authentication

Currently, the API does not require authentication. This will be added in future versions.
      `,
      contact: {
        name: 'API Support',
        email: 'support@imperia.ai',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'http://backend-service:3000',
        description: 'Kubernetes cluster (internal)',
      },
    ],
    tags: [
      {
        name: 'Analysis',
        description: 'Medical image analysis operations',
      },
      {
        name: 'Monitoring',
        description: 'System monitoring and health check endpoints',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type or title',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },
        AnalysisResponse: {
          type: 'object',
          properties: {
            analysisId: {
              type: 'string',
              description: 'Unique identifier for the analysis',
              example: 'analysis_1728168000_abc123',
            },
            status: {
              type: 'string',
              description: 'Current status of the analysis',
              enum: ['processing', 'completed', 'failed'],
              example: 'processing',
            },
            message: {
              type: 'string',
              description: 'Status message',
              example: 'Analysis started successfully',
            },
          },
        },
        Prediction: {
          type: 'object',
          properties: {
            class: {
              type: 'string',
              description: 'Predicted class',
              example: 'benign',
            },
            confidence: {
              type: 'number',
              format: 'float',
              description: 'Confidence score (0-1)',
              example: 0.92,
            },
            bounding_box: {
              type: 'object',
              properties: {
                x: { type: 'number', example: 150 },
                y: { type: 'number', example: 200 },
                width: { type: 'number', example: 80 },
                height: { type: 'number', example: 90 },
              },
            },
          },
        },
        AnalysisResult: {
          type: 'object',
          properties: {
            analysisId: { type: 'string' },
            modelName: { type: 'string', example: 'abp' },
            status: {
              type: 'string',
              enum: ['processing', 'completed', 'failed'],
            },
            result: {
              type: 'object',
              properties: {
                analysisId: { type: 'string' },
                model: { type: 'string' },
                predictions: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Prediction' },
                },
                metadata: {
                  type: 'object',
                  properties: {
                    file_name: { type: 'string' },
                    file_size_mb: { type: 'number' },
                    processing_time_sec: { type: 'number' },
                    gpu_used: { type: 'boolean' },
                  },
                },
              },
            },
            duration_ms: { type: 'number' },
            error: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time' },
          },
        },
        AnalysisMetric: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            analysis_id: { type: 'string' },
            gpu_usage: {
              type: 'number',
              description: 'GPU usage percentage',
            },
            gpu_mem_mb: {
              type: 'number',
              description: 'GPU memory usage in MB',
            },
            cpu_usage: {
              type: 'number',
              description: 'CPU usage percentage',
            },
            ram_mb: {
              type: 'number',
              description: 'RAM usage in MB',
            },
            duration_ms: {
              type: 'number',
              description: 'Elapsed time since analysis start',
            },
            throughput: {
              type: 'number',
              description: 'Processing throughput',
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
