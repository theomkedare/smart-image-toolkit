/**
 * Centralized error handling middleware
 */

const logger = require('../config/logger');
const { cleanupFiles } = require('../utils/fileUtils');

const notFound = (req, res, next) => {
  // Silently ignore browser's automatic favicon request — not a real error
  if (req.path === '/favicon.ico') {
    return res.status(204).end();
  }

  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // Clean up any uploaded files on error
  if (req.files?.length) {
    const paths = req.files.map((f) => f.path);
    cleanupFiles(paths).catch(() => {});
  } else if (req.file?.path) {
    cleanupFiles([req.file.path]).catch(() => {});
  }

  const statusCode = err.statusCode || err.status || 500;

  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 20}MB.`,
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: `Too many files. Maximum is ${process.env.MAX_FILES_PER_REQUEST || 10} files.`,
    });
  }

  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'An internal server error occurred.'
        : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };