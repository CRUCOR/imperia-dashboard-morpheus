/**
 * Error Middleware
 * Global error handler
 */

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', err);

  // Multer errors
  if (err.message.includes('Invalid file type')) {
    res.status(400).json({
      error: 'Bad Request',
      message: err.message,
    });
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(413).json({
      error: 'Payload Too Large',
      message: 'File size exceeds the 100MB limit',
    });
    return;
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
};
