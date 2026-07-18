'use strict';

const userService = require('../services/userService');
const { AppError } = require('./errorHandler');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid Authorization header', 401, 'UNAUTHORIZED');
    }

    const token = header.slice(7);
    const decoded = await userService.validateToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

module.exports = { auth, requireRole };
