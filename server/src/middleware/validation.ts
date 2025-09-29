import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger'

export const validateProcessingRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    filePath: Joi.string().required().messages({
      'string.empty': 'File path is required',
      'any.required': 'File path is required',
    }),
    modelId: Joi.string().required().messages({
      'string.empty': 'Model ID is required',
      'any.required': 'Model ID is required',
    }),
    parameters: Joi.object().default({}).messages({
      'object.base': 'Parameters must be an object',
    }),
  })

  const { error, value } = schema.validate(req.body)

  if (error) {
    logger.warn('Validation error in processing request', {
      error: error.details,
      body: req.body,
    })

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    })
  }

  req.body = value
  next()
}

export const validateJobId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    jobId: Joi.string().uuid().required().messages({
      'string.guid': 'Job ID must be a valid UUID',
      'any.required': 'Job ID is required',
    }),
  })

  const { error, value } = schema.validate(req.params)

  if (error) {
    logger.warn('Validation error in job ID', {
      error: error.details,
      params: req.params,
    })

    return res.status(400).json({
      success: false,
      error: 'Invalid job ID format',
      details: error.details.map(detail => detail.message),
    })
  }

  req.params = { ...req.params, ...value }
  next()
}

export const validateModelParameters = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { modelId, parameters } = req.body

  // Define parameter schemas for each model
  const modelSchemas: Record<string, Joi.ObjectSchema> = {
    'phishing-detection': Joi.object({
      threshold: Joi.number().min(0).max(1).default(0.8),
      model_type: Joi.string().valid('bert', 'roberta', 'distilbert').required(),
      batch_size: Joi.number().integer().min(1).max(1000).default(32),
    }),

    'sid-detection': Joi.object({
      entities: Joi.string().valid('PII', 'Financial', 'Medical', 'All').required(),
      confidence: Joi.number().min(0).max(1).default(0.75),
      redact: Joi.boolean().default(false),
    }),

    'anomaly-detection': Joi.object({
      window_size: Joi.number().integer().min(1).max(10000).default(100),
      sensitivity: Joi.string().valid('low', 'medium', 'high').default('medium'),
    }),
  }

  const schema = modelSchemas[modelId]
  if (!schema) {
    return next() // Skip validation for unknown models
  }

  const { error, value } = schema.validate(parameters || {})

  if (error) {
    logger.warn('Validation error in model parameters', {
      modelId,
      error: error.details,
      parameters,
    })

    return res.status(400).json({
      success: false,
      error: 'Invalid model parameters',
      details: error.details.map(detail => ({
        parameter: detail.path.join('.'),
        message: detail.message,
      })),
    })
  }

  req.body.parameters = value
  next()
}