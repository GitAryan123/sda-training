'use strict';

const { performance } = require('perf_hooks');

/**
 * Structured logger — outputs levelled JSON-style log lines to stdout/stderr.
 * Avoids Winston dependency while maintaining the same interface.
 */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    pid: process.pid,
    ...meta
  });
}

const logger = {
  debug: (msg, meta) => {
    if (currentLevel <= LOG_LEVELS.debug) process.stdout.write(formatLog('debug', msg, meta) + '\n');
  },
  info: (msg, meta) => {
    if (currentLevel <= LOG_LEVELS.info) process.stdout.write(formatLog('info', msg, meta) + '\n');
  },
  warn: (msg, meta) => {
    if (currentLevel <= LOG_LEVELS.warn) process.stdout.write(formatLog('warn', msg, meta) + '\n');
  },
  error: (msg, meta) => {
    // Errors always go to stderr regardless of log level
    process.stderr.write(formatLog('error', msg, meta) + '\n');
  }
};

/**
 * AppError — operational errors with HTTP status codes.
 * Non-operational errors (programming bugs) propagate without this wrapper.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware (4-arg signature required by Express).
 * Normalises all thrown values into a consistent JSON error envelope.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Classify and normalise the error
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; code = 'INVALID_TOKEN'; message = 'Invalid authentication token'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; code = 'TOKEN_EXPIRED'; message = 'Authentication token has expired'; }

  // Validation errors (from bcrypt, uuid, etc.)
  if (err.name === 'ValidationError') { statusCode = 400; code = 'VALIDATION_ERROR'; }

  // Log the error with full context
  logger.error(message, {
    code,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });

  // Build response — never leak stack traces in production
  const body = {
    success: false,
    error: { code, message }
  };

  if (process.env.NODE_ENV === 'development') {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { errorHandler, AppError, logger };
