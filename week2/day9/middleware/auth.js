'use strict';

const jwt = require('jsonwebtoken');
const { createAppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'day9-dev-secret-key';

/**
 * Authentication Middleware
 * Validates the Authorization: Bearer <token> header.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createAppError('Access token is required', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(createAppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(createAppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Authorization Middleware Factory (Curried functional middleware creator)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createAppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createAppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Gracefully fallback without setting req.user
    next();
  }
};

module.exports = { authMiddleware, authorize, optionalAuth };
