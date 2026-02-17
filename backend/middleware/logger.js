/**
 * HTTP request logger using Morgan piped into Winston
 */

const morgan = require('morgan');
const logger = require('../config/logger');

const stream = {
  write: (message) => logger.http(message.trim()),
};

const httpLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream }
);

module.exports = { httpLogger };