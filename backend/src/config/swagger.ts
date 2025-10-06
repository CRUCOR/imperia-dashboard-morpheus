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
