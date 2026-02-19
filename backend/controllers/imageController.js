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
  console.log('=== PROCESS REQUEST RECEIVED ===');
  
  const files = req.files;

  if (!files || files.length === 0) {
    console.log('ERROR: No files uploaded');
    return res.status(400).json({ success: false, error: 'No files uploaded.' });
  }

  console.log('Files received:', files.length);

  let settings;
  try {
    settings = req.body.settings ? JSON.parse(req.body.settings) : {};
    console.log('Settings:', settings);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid settings JSON.' });
  }

  const uploadedPaths = files.map((f) => f.path);

  try {
    if (files.length === 1) {
      console.log('Processing single file...');
      
      const file = files[0];
      const originalSize = await getFileSize(file.path);
      
      console.log('Calling processImage...');
      const processed = await processImage({
        inputPath: file.path,
        originalName: file.originalname,
        settings,
      });

      console.log('Processing complete:', processed);

      // Check if output file exists
      if (!fs.existsSync(processed.outputPath)) {
        throw new Error('Processed file was not created');
      }

      const processedSize = await getFileSize(processed.outputPath);
      console.log('File sizes - original:', originalSize, 'processed:', processedSize);

      const ext = processed.outputFormat === 'jpeg' ? 'jpg' : processed.outputFormat;
      const mimeMap = { 
        jpeg: 'image/jpeg', 
        png: 'image/png', 
        webp: 'image/webp', 
        avif: 'image/avif' 
      };

      const compressionRatio = originalSize > 0 
        ? ((1 - processedSize / originalSize) * 100).toFixed(1) 
        : '0';

      // Send metadata as headers
      res.setHeader('Content-Type', mimeMap[processed.outputFormat] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="processed.${ext}"`);
      res.setHeader('X-Original-Name', file.originalname || 'unknown');
      res.setHeader('X-Original-Size', originalSize.toString());
      res.setHeader('X-Processed-Size', processedSize.toString());
      res.setHeader('X-Original-Width', (processed.sourceDimensions?.width || 0).toString());
      res.setHeader('X-Original-Height', (processed.sourceDimensions?.height || 0).toString());
      res.setHeader('X-Processed-Width', (processed.outputDimensions?.width || 0).toString());
      res.setHeader('X-Processed-Height', (processed.outputDimensions?.height || 0).toString());
      res.setHeader('X-Compression-Ratio', compressionRatio);
      res.setHeader('X-Output-Format', processed.outputFormat || 'jpeg');
      res.setHeader('Access-Control-Expose-Headers', 
        'X-Original-Name,X-Original-Size,X-Processed-Size,X-Original-Width,X-Original-Height,X-Processed-Width,X-Processed-Height,X-Compression-Ratio,X-Output-Format'
      );

      console.log('Streaming file:', processed.outputPath);

      // Stream file
      const stream = fs.createReadStream(processed.outputPath);
      
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        logger.error(`Stream error: ${err.message}`);
        cleanupFiles([...uploadedPaths, processed.outputPath]).catch(() => {});
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to stream file' });
        }
      });

      stream.on('end', () => {
        console.log('Stream ended, cleaning up files');
        cleanupFiles([...uploadedPaths, processed.outputPath]).catch(() => {});
      });

      stream.pipe(res);

    } else {
      console.log('Processing multiple files as ZIP...');
      
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
          
          if (fs.existsSync(processed.outputPath)) {
            const ext = processed.outputFormat === 'jpeg' ? 'jpg' : processed.outputFormat;
            const baseName = file.originalname.replace(/\.[^/.]+$/, '');
            archive.file(processed.outputPath, { name: `${baseName}.${ext}` });
            processedPaths.push(processed.outputPath);
          }
        } catch (err) {
          logger.error(`Failed to process ${file.originalname}: ${err.message}`);
          console.error(`Failed to process ${file.originalname}:`, err);
        }
      }

      archive.finalize();
      
      archive.on('end', () => {
        console.log('ZIP archive complete');
        cleanupFiles([...uploadedPaths, ...processedPaths]).catch(() => {});
      });
      
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        logger.error(`Archive error: ${err.message}`);
        cleanupFiles([...uploadedPaths, ...processedPaths]).catch(() => {});
      });
    }
  } catch (err) {
    console.error('Process error:', err);
    await cleanupFiles(uploadedPaths).catch(() => {});
    logger.error(`Process error: ${err.message}`, { stack: err.stack });
    
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

/**
 * POST /api/v1/images/download-zip
 * Bundle processed images into a ZIP for download
 */
const downloadZip = (req, res, next) => {
  const { filenames } = req.body;

  if (!Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).json({ success: false, error: 'No filenames provided.' });
  }

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