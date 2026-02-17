/**
 * Smart Image Toolkit - Express Server
 * Entry point: bootstraps app, middleware, routes, and cleanup scheduler
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const { httpLogger } = require('./middleware/logger');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const imageRoutes = require('./routes/imageRoutes');
const { ensureDirectories, scheduleCleanup } = require('./utils/fileUtils');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure Required Directories Exist ────────────────────────────────────────
ensureDirectories();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // prevent JSON payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(httpLogger); // HTTP request logging via Morgan → Winston
app.use(globalRateLimiter); // global rate limiting

// ─── Static: Serve Processed Images ───────────────────────────────────────────
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/images', imageRoutes);

// ─── 404 + Global Error Handler ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// ─── Schedule Temp File Cleanup ───────────────────────────────────────────────
scheduleCleanup();

module.exports = app;