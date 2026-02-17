/**
 * Custom hook — manages upload state, settings, processing, and results
 */

import { useState, useCallback } from 'react';
import { processImages as apiProcess, downloadZip as apiZip } from '../utils/api';

const DEFAULT_SETTINGS = {
  width: '',
  height: '',
  maintainAspectRatio: true,
  quality: 80,
  format: 'jpeg',
};

export const useImageProcessor = () => {
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasProcessed, setHasProcessed] = useState(false);

  const addFiles = useCallback((newFiles) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const unique = newFiles.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...unique].slice(0, 10); // hard cap at 10
    });
    setResults([]);
    setErrors([]);
    setHasProcessed(false);
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults([]);
    setErrors([]);
    setUploadProgress(0);
    setHasProcessed(false);
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const process = useCallback(async () => {
    if (!files.length) return;

    setIsProcessing(true);
    setUploadProgress(0);
    setResults([]);
    setErrors([]);

    try {
      const data = await apiProcess(files, settings, setUploadProgress);
      setResults(data.processed || []);
      setErrors(data.errors || []);
      setHasProcessed(true);
    } catch (err) {
      setErrors([{ file: 'batch', error: err.message }]);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [files, settings]);

  const downloadAllZip = useCallback(async () => {
    if (!results.length) return;
    const filenames = results.map((r) => r.processedName);
    await apiZip(filenames);
  }, [results]);

  return {
    files,
    settings,
    results,
    errors,
    isProcessing,
    uploadProgress,
    hasProcessed,
    addFiles,
    removeFile,
    clearAll,
    updateSetting,
    process,
    downloadAllZip,
  };
};