/**
 * Multer configuration
 * Handles file upload validation, naming, and storage
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_REQUEST || '10', 10);
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: MAX_FILES,
  },
});

module.exports = { upload, MAX_FILES, MAX_SIZE_MB };