/**
 * Axios API client
 * Centralized request handling with interceptors
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  timeout: 120000,
});

// Request interceptor — attach auth token when implemented
api.interceptors.request.use((config) => {
  // const token = localStorage.getItem('token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

/**
 * Upload and process images
 * @param {File[]} files
 * @param {Object} settings
 * @param {Function} onProgress - (percent: number) => void
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

  console.log('Response headers:', response.headers);
  console.log('Response type:', response.headers['content-type']);

  // Multiple files → ZIP download
  if (response.headers['content-type']?.includes('zip')) {
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-images.zip';
    a.click();
    URL.revokeObjectURL(url);
    return { 
      processed: [], 
      errors: [], 
      total: files.length, 
      succeeded: files.length, 
      failed: 0, 
      isZip: true 
    };
  }

  // Single file → extract metadata from headers + create preview URL
  const h = response.headers;
  const blobUrl = URL.createObjectURL(response.data);

  const originalSize = parseInt(h['x-original-size'] || '0', 10);
  const processedSize = parseInt(h['x-processed-size'] || '0', 10);

  return {
    isZip: false,
    processed: [{
      originalName: h['x-original-name'] || files[0].name,
      originalSize,
      originalDimensions: {
        width: parseInt(h['x-original-width'] || '0', 10),
        height: parseInt(h['x-original-height'] || '0', 10),
      },
      originalFormat: files[0].type.split('/')[1] || 'unknown',
      processedName: `processed.${h['x-output-format'] === 'jpeg' ? 'jpg' : h['x-output-format']}`,
      processedSize,
      processedDimensions: {
        width: parseInt(h['x-processed-width'] || '0', 10),
        height: parseInt(h['x-processed-height'] || '0', 10),
      },
      processedFormat: h['x-output-format'] || 'jpeg',
      downloadUrl: blobUrl,
      compressionRatio: h['x-compression-ratio'] || '0',
      blob: response.data, // Store blob for download
    }],
    errors: [],
    total: 1,
    succeeded: 1,
    failed: 0,
  };
};

/**
 * Download multiple processed files as ZIP
 * @param {string[]} filenames
 */
export const downloadZip = async (filenames) => {
  const response = await api.post(
    '/images/download-zip',
    { filenames },
    { responseType: 'blob' }
  );

  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'processed-images.zip';
  a.click();
  URL.revokeObjectURL(url);
};

export default api;