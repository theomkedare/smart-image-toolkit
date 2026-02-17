/**
 * Sharp-based image processing utility
 * Handles: resize, compress, format conversion
 */

const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { DIRS } = require('./fileUtils');

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'avif'];
const FORMAT_ALIASES = { jpg: 'jpeg' };

/**
 * Process a single image file
 * @param {Object} options
 * @param {string} options.inputPath - Absolute path to source file
 * @param {string} options.originalName - Original filename
 * @param {Object} options.settings - Processing settings from client
 * @returns {Promise<Object>} - Result metadata
 */
const processImage = async ({ inputPath, originalName, settings }) => {
  const {
    width,
    height,
    maintainAspectRatio = true,
    quality = 80,
    format = 'jpeg',
  } = settings;

  // Normalize format alias (jpg → jpeg)
  const normalizedFormat = FORMAT_ALIASES[format] || format;

  if (!SUPPORTED_FORMATS.includes(normalizedFormat)) {
    throw new Error(`Unsupported format: ${format}. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Quality bounds
  const clampedQuality = Math.min(100, Math.max(1, parseInt(quality, 10)));

  // Output filename
  const ext = normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat;
  const outputFilename = `${uuidv4()}.${ext}`;
  const outputPath = path.join(DIRS.processed, outputFilename);

  // Build Sharp pipeline
  let pipeline = sharp(inputPath);

  // Get source metadata
  const metadata = await pipeline.metadata();

  // Apply resize if dimensions provided
  if (width || height) {
    pipeline = pipeline.resize({
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      fit: maintainAspectRatio ? 'inside' : 'fill',
      withoutEnlargement: true,
    });
  }

  // Apply format + quality
  switch (normalizedFormat) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: clampedQuality, mozjpeg: true });
      break;
    case 'png':
      // PNG quality: map 1-100 to compressionLevel 9-0
      pipeline = pipeline.png({
        compressionLevel: Math.round((100 - clampedQuality) / 11),
        quality: clampedQuality,
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: clampedQuality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: clampedQuality });
      break;
  }

  // Write output
  const outputInfo = await pipeline.toFile(outputPath);

  return {
    outputPath,
    outputFilename,
    outputFormat: normalizedFormat,
    outputDimensions: { width: outputInfo.width, height: outputInfo.height },
    sourceFormat: metadata.format,
    sourceDimensions: { width: metadata.width, height: metadata.height },
  };
};

module.exports = { processImage, SUPPORTED_FORMATS };