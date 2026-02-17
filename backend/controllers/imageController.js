/**
 * Image Controller
 * Handles: upload, process (single & bulk), download ZIP, metadata
 */

const path = require('path');
const archiver = require('archiver');
const fs = require('fs');

const { processImage } = require('../utils/imageProcessor');
const { cleanupFiles, getFileSize } = require('../utils/fileUtils');
const logger = require('../config/logger');

/**
 * POST /api/v1/images/process
 * Process one or more uploaded images
 */
const processImages = async (req, res, next) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded.' });
  }

  let settings;
  try {
    settings = req.body.settings ? JSON.parse(req.body.settings) : {};
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid settings JSON.' });
  }

  const uploadedPaths = files.map((f) => f.path);
  const results = [];
  const errors = [];

  await Promise.all(
    files.map(async (file) => {
      try {
        const originalSize = await getFileSize(file.path);

        const processed = await processImage({
          inputPath: file.path,
          originalName: file.originalname,
          settings,
        });

        const processedSize = await getFileSize(processed.outputPath);

        results.push({
          originalName: file.originalname,
          originalSize,
          originalDimensions: processed.sourceDimensions,
          originalFormat: processed.sourceFormat,
          processedName: processed.outputFilename,
          processedSize,
          processedDimensions: processed.outputDimensions,
          processedFormat: processed.outputFormat,
          downloadUrl: `/processed/${processed.outputFilename}`,
          compressionRatio: originalSize > 0
            ? ((1 - processedSize / originalSize) * 100).toFixed(1)
            : '0',
        });
      } catch (err) {
        logger.error(`Failed to process ${file.originalname}: ${err.message}`);
        errors.push({ file: file.originalname, error: err.message });
      }
    })
  );

  // Delete temp upload files after processing
  await cleanupFiles(uploadedPaths);

  logger.info(`Processed ${results.length} image(s), ${errors.length} error(s).`);

  res.status(200).json({
    success: true,
    processed: results,
    errors,
    total: files.length,
    succeeded: results.length,
    failed: errors.length,
  });
};

/**
 * POST /api/v1/images/download-zip
 * Bundle processed images into a ZIP for download
 * Body: { filenames: ['abc.jpg', 'def.webp'] }
 */
const downloadZip = (req, res, next) => {
  const { filenames } = req.body;

  if (!Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).json({ success: false, error: 'No filenames provided.' });
  }

  // Sanitize filenames to prevent path traversal
  const safe = filenames.map((f) => path.basename(f));

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="processed-images.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    logger.error(`ZIP archive error: ${err.message}`);
    next(err);
  });

  archive.pipe(res);

  let found = 0;
  safe.forEach((filename) => {
    const filePath = path.join(__dirname, '../processed', filename);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: filename });
      found++;
    }
  });

  if (found === 0) {
    return res.status(404).json({ success: false, error: 'No valid files found.' });
  }

  archive.finalize();
  logger.info(`ZIP download: ${found} file(s)`);
};

/**
 * GET /api/v1/images/metadata/:filename
 * Return image metadata from /processed directory (no processing)
 */
const getMetadata = async (req, res, next) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, '../processed', safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found.' });
  }

  try {
    const sharp = require('sharp');
    const metadata = await sharp(filePath).metadata();
    const size = await getFileSize(filePath);

    res.json({
      success: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size,
        channels: metadata.channels,
        space: metadata.space,
        hasAlpha: metadata.hasAlpha,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { processImages, downloadZip, getMetadata };