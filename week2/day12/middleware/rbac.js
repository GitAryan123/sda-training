'use strict';

const { AppError } = require('./errorHandler');

// Granular permission definitions mapping to authorized roles
const PERMISSIONS = {
  // User permissions
  'users:read': ['admin', 'moderator'],
  'users:write': ['admin'],
  'users:delete': ['admin'],
  
  // Product permissions
  'products:read': ['admin', 'moderator', 'user'],
  'products:write': ['admin', 'moderator'],
  'products:delete': ['admin'],
  
  // Order permissions
  'orders:read': ['admin', 'moderator', 'user'],
  'orders:write': ['admin', 'moderator', 'user'],
  'orders:delete': ['admin'],
  
  // Analytics permissions
  'analytics:read': ['admin', 'moderator'],
  'analytics:write': ['admin'],
  
  // System permissions
  'system:read': ['admin'],
  'system:write': ['admin'],
  'system:delete': ['admin']
};

/**
 * Check if the user has a specific permission
 */
const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(user.role);
};

/**
 * Middleware ensuring a single permission is met
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!hasPermission(req.user, permission)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware ensuring at least one permission matches
 */
const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAny = permissions.some(permission => hasPermission(req.user, permission));
    if (!hasAny) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware ensuring all listed permissions match
 */
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAll = permissions.every(permission => hasPermission(req.user, permission));
    if (!hasAll) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware protecting user ownership rights on objects (e.g. users, profile items)
 */
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admins bypass ownership checks
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    if (resourceUserId && resourceUserId !== req.user._id.toString()) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware checking roles directly
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient role permissions', 403));
    }

    next();
  };
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnership,
  requireRole
};
