import multer from 'multer'
import path from 'path'
import { config } from '@/config'
import { logger } from '@/utils/logger'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.uploadPath)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext)
    const safeFileName = `${baseName}_${timestamp}${ext}`
    cb(null, safeFileName)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = config.upload.allowedExtensions
  const fileExt = path.extname(file.originalname).toLowerCase()

  if (allowedExtensions.includes(fileExt)) {
    cb(null, true)
  } else {
    logger.warn('Rejected file upload due to invalid extension', {
      fileName: file.originalname,
      extension: fileExt,
      allowedExtensions,
    })
    cb(new Error(`File type not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`))
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,
  },
}).single('file')

export const handleUploadError = (
  error: any,
  req: any,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: `File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB`,
        })
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files. Only one file allowed per upload',
        })
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Use "file" as the field name',
        })
      default:
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`,
        })
    }
  }

  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      error: error.message,
    })
  }

  logger.error('Upload middleware error', { error })
  return res.status(500).json({
    success: false,
    error: 'Internal server error during file upload',
  })
}