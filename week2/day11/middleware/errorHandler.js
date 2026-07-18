'use strict';

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, details = null, code = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    this.code = code || (
      statusCode === 400 ? 'VALIDATION_ERROR' :
      statusCode === 401 ? 'UNAUTHORIZED' :
      statusCode === 403 ? 'FORBIDDEN' :
      statusCode === 404 ? 'NOT_FOUND' :
      statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' :
      'INTERNAL_ERROR'
    );
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  let details = err.details || null;
  let code = err.code || 'INTERNAL_ERROR';

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

  logger.error(message, {
    statusCode,
    code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack
  });

  const errorBody = {
    success: false,
    error: {
      message,
      code,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(errorBody);
};

module.exports = { errorHandler, AppError, logger };
