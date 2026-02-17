/**
 * Rate limiting middleware
 * Global limiter + stricter limiter for processing endpoint
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

const WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

// Global rate limiter
const globalRateLimiter = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(WINDOW_MINUTES),
    });
  },
});

// Stricter limiter for processing endpoint
const processRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Process rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Processing limit reached. Please wait a moment.',
    });
  },
});

module.exports = { globalRateLimiter, processRateLimiter };