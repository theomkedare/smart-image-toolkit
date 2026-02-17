/**
 * File system utilities:
 * - Directory creation
 * - File cleanup (single, batch, age-based)
 * - Cleanup scheduler
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

const DIRS = {
  uploads: path.join(__dirname, '../uploads'),
  processed: path.join(__dirname, '../processed'),
  logs: path.join(__dirname, '../logs'),
};

/**
 * Ensure required directories exist on startup
 */
const ensureDirectories = () => {
  Object.values(DIRS).forEach((dir) => {
    require('fs').mkdirSync(dir, { recursive: true });
  });
  logger.info('Storage directories verified.');
};

/**
 * Delete a list of file paths (ignores missing files)
 * @param {string[]} filePaths
 */
const cleanupFiles = async (filePaths) => {
  await Promise.allSettled(
    filePaths.map((fp) => fs.unlink(fp).catch(() => {}))
  );
};

/**
 * Delete files in a directory older than TTL minutes
 * @param {string} dir
 * @param {number} ttlMinutes
 */
const cleanupOldFiles = async (dir, ttlMinutes) => {
  try {
    const files = await fs.readdir(dir);
    const now = Date.now();
    const ttlMs = ttlMinutes * 60 * 1000;

    let deleted = 0;
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        try {
          const stat = await fs.stat(filePath);
          if (now - stat.mtimeMs > ttlMs) {
            await fs.unlink(filePath);
            deleted++;
          }
        } catch {
          // File may have been deleted already
        }
      })
    );

    if (deleted > 0) {
      logger.info(`Cleanup: deleted ${deleted} old file(s) from ${path.basename(dir)}`);
    }
  } catch (err) {
    logger.error(`Cleanup error in ${dir}: ${err.message}`);
  }
};

/**
 * Schedule periodic cleanup of uploads and processed folders
 */
const scheduleCleanup = () => {
  const intervalMs = parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '30', 10) * 60 * 1000;
  const ttl = parseInt(process.env.FILE_TTL_MINUTES || '60', 10);

  setInterval(() => {
    cleanupOldFiles(DIRS.uploads, ttl);
    cleanupOldFiles(DIRS.processed, ttl);
  }, intervalMs);

  logger.info(`File cleanup scheduled every ${process.env.CLEANUP_INTERVAL_MINUTES || 30} minutes (TTL: ${ttl} min)`);
};

/**
 * Get file size in bytes
 * @param {string} filePath
 * @returns {Promise<number>}
 */
const getFileSize = async (filePath) => {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
};

module.exports = { ensureDirectories, cleanupFiles, cleanupOldFiles, scheduleCleanup, getFileSize, DIRS };