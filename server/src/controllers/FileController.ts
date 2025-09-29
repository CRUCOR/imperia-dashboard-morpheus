import { Request, Response } from 'express'
import { logger } from '@/utils/logger'
import type { IFileRepository } from '@/repositories/FileRepository'

export class FileController {
  constructor(private readonly fileRepository: IFileRepository) {}

  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided',
        })
        return
      }

      logger.info('File upload received', {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      })

      const uploadedFile = await this.fileRepository.save(req.file)

      res.json({
        success: true,
        data: {
          id: uploadedFile.id,
          name: uploadedFile.originalName,
          size: uploadedFile.size,
          type: uploadedFile.mimetype,
          path: uploadedFile.path,
          uploadTime: uploadedFile.uploadTime,
        },
      })
    } catch (error) {
      logger.error('File upload failed', { error })
      res.status(500).json({
        success: false,
        error: 'File upload failed',
      })
    }
  }

  getFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params
      const file = await this.fileRepository.findById(fileId)

      if (!file) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        })
        return
      }

      res.json({
        success: true,
        data: {
          id: file.id,
          name: file.originalName,
          size: file.size,
          type: file.mimetype,
          path: file.path,
          uploadTime: file.uploadTime,
        },
      })
    } catch (error) {
      logger.error('Failed to get file info', { fileId: req.params.fileId, error })
      res.status(500).json({
        success: false,
        error: 'Failed to get file information',
      })
    }
  }

  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params
      const deleted = await this.fileRepository.delete(fileId)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'File not found or could not be deleted',
        })
        return
      }

      logger.info('File deleted successfully', { fileId })

      res.json({
        success: true,
        message: 'File deleted successfully',
      })
    } catch (error) {
      logger.error('Failed to delete file', { fileId: req.params.fileId, error })
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
      })
    }
  }
}