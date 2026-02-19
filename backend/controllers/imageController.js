/**
 * Image Controller
 * Handles: upload, process (single & bulk), download ZIP, metadata
 */

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

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

  try {
    if (files.length === 1) {
      // ── Single file: stream directly back as binary ──────────────────
      const file = files[0];
      const originalSize = await getFileSize(file.path);
      
      const processed = await processImage({
        inputPath: file.path,
        originalName: file.originalname,
        settings,
      });

      const processedSize = await getFileSize(processed.outputPath);
      const ext = processed.outputFormat === 'jpeg' ? 'jpg' : processed.outputFormat;
      const mimeMap = { 
        jpeg: 'image/jpeg', 
        png: 'image/png', 
        webp: 'image/webp', 
        avif: 'image/avif' 
      };

      // Send metadata as headers, file as body
      res.setHeader('Content-Type', mimeMap[processed.outputFormat] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="processed.${ext}"`);
      res.setHeader('X-Original-Name', file.originalname);
      res.setHeader('X-Original-Size', originalSize.toString());
      res.setHeader('X-Processed-Size', processedSize.toString());
      res.setHeader('X-Original-Width', (processed.sourceDimensions?.width || 0).toString());
      res.setHeader('X-Original-Height', (processed.sourceDimensions?.height || 0).toString());
      res.setHeader('X-Processed-Width', (processed.outputDimensions?.width || 0).toString());
      res.setHeader('X-Processed-Height', (processed.outputDimensions?.height || 0).toString());
      res.setHeader('X-Compression-Ratio', originalSize > 0 
        ? ((1 - processedSize / originalSize) * 100).toFixed(1) 
        : '0'
      );
      res.setHeader('X-Output-Format', processed.outputFormat);
      res.setHeader('Access-Control-Expose-Headers', 
        'X-Original-Name,X-Original-Size,X-Processed-Size,X-Original-Width,X-Original-Height,X-Processed-Width,X-Processed-Height,X-Compression-Ratio,X-Output-Format'
      );

      // Stream file then delete both files
      const stream = fs.createReadStream(processed.outputPath);
      stream.pipe(res);
      stream.on('end', () => {
        cleanupFiles([...uploadedPaths, processed.outputPath]).catch(() => {});
      });
      stream.on('error', (err) => {
        logger.error(`Stream error: ${err.message}`);
        cleanupFiles([...uploadedPaths, processed.outputPath]).catch(() => {});
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to stream file' });
        }
      });

    } else {
      // ── Multiple files: return as ZIP ────────────────────────────────
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="processed-images.zip"');

      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.pipe(res);

      const processedPaths = [];

      for (const file of files) {
        try {
          const processed = await processImage({
            inputPath: file.path,
            originalName: file.originalname,
            settings,
          });
          const ext = processed.outputFormat === 'jpeg' ? 'jpg' : processed.outputFormat;
          const baseName = file.originalname.replace(/\.[^/.]+$/, '');
          archive.file(processed.outputPath, { name: `${baseName}.${ext}` });
          processedPaths.push(processed.outputPath);
        } catch (err) {
          logger.error(`Failed to process ${file.originalname}: ${err.message}`);
        }
      }

      archive.finalize();
      archive.on('end', () => {
        cleanupFiles([...uploadedPaths, ...processedPaths]).catch(() => {});
      });
      archive.on('error', (err) => {
        logger.error(`Archive error: ${err.message}`);
        cleanupFiles([...uploadedPaths, ...processedPaths]).catch(() => {});
      });
    }
  } catch (err) {
    await cleanupFiles(uploadedPaths).catch(() => {});
    logger.error(`Process error: ${err.message}`, { stack: err.stack });
    next(err);
  }
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