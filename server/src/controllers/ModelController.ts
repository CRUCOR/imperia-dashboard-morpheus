import { Request, Response } from 'express'
import { logger } from '@/utils/logger'
import type { IMorpheusService } from '@/services/MorpheusService'

export class ModelController {
  constructor(private readonly morpheusService: IMorpheusService) {}

  getModels = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching available Morpheus models')
      const models = await this.morpheusService.getAvailableModels()

      res.json({
        success: true,
        data: models,
        count: models.length,
      })
    } catch (error) {
      logger.error('Failed to fetch models', { error })
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available models',
      })
    }
  }

  getModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelId } = req.params
      const models = await this.morpheusService.getAvailableModels()
      const model = models.find(m => m.id === modelId)

      if (!model) {
        res.status(404).json({
          success: false,
          error: 'Model not found',
        })
        return
      }

      logger.info('Model details retrieved', { modelId })

      res.json({
        success: true,
        data: model,
      })
    } catch (error) {
      logger.error('Failed to get model details', { modelId: req.params.modelId, error })
      res.status(500).json({
        success: false,
        error: 'Failed to get model details',
      })
    }
  }

  validateModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelId } = req.params
      const isValid = await this.morpheusService.validateModel(modelId)

      logger.info('Model validation completed', { modelId, isValid })

      res.json({
        success: true,
        data: {
          modelId,
          isValid,
        },
      })
    } catch (error) {
      logger.error('Model validation failed', { modelId: req.params.modelId, error })
      res.status(500).json({
        success: false,
        error: 'Model validation failed',
      })
    }
  }
}