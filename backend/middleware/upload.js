import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../config/logger.js';

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`File type not allowed. Allowed types: PDF, DOC, DOCX, TXT`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: parseInt(process.env.MAX_FILES_PER_SUBMISSION) || 10 // 10 files default
  }
});

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer error:', error);

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: `Maximum file size allowed is ${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: `Maximum ${parseInt(process.env.MAX_FILES_PER_SUBMISSION) || 10} files allowed per submission`
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'Unexpected file upload field'
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          message: error.message
        });
    }
  } else if (error) {
    logger.error('Upload error:', error);
    return res.status(400).json({
      error: 'File upload error',
      message: error.message
    });
  }

  next();
};

// Function to cleanup uploaded files (for cleanup on error)
export const cleanupFiles = (files) => {
  if (!files || !Array.isArray(files)) return;

  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.info(`Cleaned up file: ${file.path}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up file ${file.path}:`, error);
    }
  });
};

export default upload;