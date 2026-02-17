/**
 * Axios API client
 * Centralized request handling with interceptors
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120000, // 2 min for large files
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

  const { data } = await api.post('/images/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  return data;
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