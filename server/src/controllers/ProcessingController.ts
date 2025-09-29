import { Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '@/utils/logger'
import type { IProcessingService } from '@/services/ProcessingService'
import type { ProcessingRequest } from '@/types'

export class ProcessingController {
  constructor(private readonly processingService: IProcessingService) {}

  processFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filePath, modelId, parameters } = req.body as ProcessingRequest

      logger.info('Processing request received', {
        filePath,
        modelId,
        parameters,
      })

      // Validate file exists
      try {
        await fs.access(filePath)
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Input file not found or not accessible',
        })
        return
      }

      const job = await this.processingService.processFile({
        filePath,
        modelId,
        parameters,
      })

      res.status(202).json({
        success: true,
        message: 'Processing started',
        data: job.toJSON(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to start processing', { error: errorMessage, body: req.body })

      res.status(400).json({
        success: false,
        error: errorMessage,
      })
    }
  }

  getJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params
      const job = await this.processingService.getProcessingStatus(jobId)

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found',
        })
        return
      }

      res.json({
        success: true,
        data: job.toJSON(),
      })
    } catch (error) {
      logger.error('Failed to get job status', { jobId: req.params.jobId, error })
      res.status(500).json({
        success: false,
        error: 'Failed to get job status',
      })
    }
  }

  getAllJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobs = await this.processingService.getAllJobs()

      res.json({
        success: true,
        data: jobs.map(job => job.toJSON()),
        count: jobs.length,
      })
    } catch (error) {
      logger.error('Failed to get jobs', { error })
      res.status(500).json({
        success: false,
        error: 'Failed to get jobs',
      })
    }
  }

  cancelJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params
      const cancelled = await this.processingService.cancelJob(jobId)

      if (!cancelled) {
        res.status(400).json({
          success: false,
          error: 'Job not found or cannot be cancelled',
        })
        return
      }

      logger.info('Job cancelled successfully', { jobId })

      res.json({
        success: true,
        message: 'Job cancelled successfully',
      })
    } catch (error) {
      logger.error('Failed to cancel job', { jobId: req.params.jobId, error })
      res.status(500).json({
        success: false,
        error: 'Failed to cancel job',
      })
    }
  }

  downloadResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params
      const job = await this.processingService.getProcessingStatus(jobId)

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found',
        })
        return
      }

      if (!job.isCompleted() || !job.csvOutputPath) {
        res.status(400).json({
          success: false,
          error: 'Job not completed or no output file available',
        })
        return
      }

      try {
        await fs.access(job.csvOutputPath)
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'Output file not found',
        })
        return
      }

      const fileName = path.basename(job.csvOutputPath)
      logger.info('Starting file download', { jobId, fileName })

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

      // Stream the file to the response
      const fileStream = require('fs').createReadStream(job.csvOutputPath)
      fileStream.pipe(res)

      fileStream.on('error', (error: Error) => {
        logger.error('Error streaming file', { jobId, fileName, error })
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download file',
          })
        }
      })

      fileStream.on('end', () => {
        logger.info('File download completed', { jobId, fileName })
      })

    } catch (error) {
      logger.error('Failed to download result', { jobId: req.params.jobId, error })
      res.status(500).json({
        success: false,
        error: 'Failed to download result',
      })
    }
  }
}