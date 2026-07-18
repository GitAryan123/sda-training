'use strict';

const logger = require('./logger');

/**
 * AppError Factory
 * Creates and returns a customized Error instance representing operational failures.
 *
 * @param {string} message Error message.
 * @param {number} statusCode HTTP status code.
 * @param {any} [details=null] Optional error details (e.g., validation payloads).
 * @returns {Error} The constructed error object.
 */
function createAppError(message, statusCode, details = null, code = null) {
  const error = new Error(message);
  error.name = 'AppError';
  error.statusCode = statusCode;
  error.isOperational = true;
  error.details = details;
  
  // Auto-derive standard error codes from status codes if not explicitly provided
  error.code = code || (
    statusCode === 400 ? 'VALIDATION_ERROR' :
    statusCode === 401 ? 'UNAUTHORIZED' :
    statusCode === 403 ? 'FORBIDDEN' :
    statusCode === 404 ? 'NOT_FOUND' :
    statusCode === 409 ? 'CONFLICT' :
    'INTERNAL_ERROR'
  );

  Error.captureStackTrace(error, createAppError);
  return error;
}

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Default values for standard unexpected errors
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  let details = err.details || null;
  let code = err.code || 'INTERNAL_ERROR';

  // Normalise specific database / library errors
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
    code = 'NOT_FOUND';
  } else if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
    code = 'DUPLICATE_KEY';
  } else if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
    code = 'UNAUTHORIZED';
  } else if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
  } else if (err.status === 429) {
    message = 'Too many requests, please try again later';
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
  }

  // Log error using Winston logger
  logger.error(message, {
    statusCode,
    code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || null,
    stack: err.stack
  });

  // Construct error response body
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = { 
  errorHandler, 
  AppError: createAppError, // Alias for backward compatibility
  createAppError 
};