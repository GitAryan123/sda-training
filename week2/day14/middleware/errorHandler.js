'use strict';

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, { statusCode, stack: err.stack });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = { errorHandler, AppError, logger };
