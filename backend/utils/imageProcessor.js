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
export const processImages = async (files, settings, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  formData.append('settings', JSON.stringify(settings));

  const response = await api.post('/images/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  // Multiple files → ZIP download
  if (response.headers['content-type']?.includes('zip')) {
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-images.zip';
    a.click();
    URL.revokeObjectURL(url);
    return { processed: [], errors: [], total: files.length, succeeded: files.length, failed: 0, isZip: true };
  }

  // Single file → extract metadata from headers + create preview URL
  const h = response.headers;
  const blobUrl = URL.createObjectURL(response.data);

  const originalSize = parseInt(h['x-original-size'] || '0');
  const processedSize = parseInt(h['x-processed-size'] || '0');

  return {
    isZip: false,
    processed: [{
      originalName: h['x-original-name'] || files[0].name,
      originalSize,
      originalDimensions: {
        width: parseInt(h['x-original-width'] || '0'),
        height: parseInt(h['x-original-height'] || '0'),
      },
      originalFormat: files[0].type.split('/')[1],
      processedName: `processed.${h['x-output-format'] === 'jpeg' ? 'jpg' : h['x-output-format']}`,
      processedSize,
      processedDimensions: {
        width: parseInt(h['x-processed-width'] || '0'),
        height: parseInt(h['x-processed-height'] || '0'),
      },
      processedFormat: h['x-output-format'],
      downloadUrl: blobUrl,
      compressionRatio: h['x-compression-ratio'] || '0',
    }],
    errors: [],
    total: 1,
    succeeded: 1,
    failed: 0,
  };
};

module.exports = { processImage, SUPPORTED_FORMATS };