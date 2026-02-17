/**
 * Image routes
 * Base: /api/v1/images
 */

const express = require('express');
const router = express.Router();

const { upload } = require('../config/multer');
const { processRateLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth.stub');
const { processImages, downloadZip, getMetadata } = require('../controllers/imageController');

// Apply auth stub to all routes (swap for real auth later)
router.use(authMiddleware);

// Process images (upload + transform in one step)
router.post(
  '/process',
  processRateLimiter,
  upload.array('images', parseInt(process.env.MAX_FILES_PER_REQUEST || '10', 10)),
  processImages
);

// Download multiple processed images as ZIP
router.post('/download-zip', downloadZip);

// Get metadata for a processed file
router.get('/metadata/:filename', getMetadata);

module.exports = router;