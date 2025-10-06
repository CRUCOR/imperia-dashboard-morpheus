/**
 * Upload Middleware
 * Configures multer for file uploads
 */

import multer from 'multer';

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, medical imaging formats, and jsonlines
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'application/dicom',
      'application/octet-stream',
      'application/json',
      'text/plain',
      'application/x-ndjson',
    ];

    // Also accept .jsonlines extension
    const allowedExtensions = ['.jsonlines', '.jsonl', '.ndjson'];
    const hasAllowedExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

    if (allowedMimeTypes.includes(file.mimetype) || hasAllowedExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, DICOM, and .jsonlines files are allowed.'));
    }
  },
});

export default upload;
