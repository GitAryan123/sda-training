'use strict';

const { performance } = require('perf_hooks');
const logger = require('./logger');

/**
 * Performance Monitor Factory
 * Encloses timers and exposes operations for timing and health metrics.
 */
function createPerformanceMonitor() {
  const timers = new Map();
  const startTime = Date.now();

  const startTimer = (name) => {
    timers.set(name, performance.now());
  };

  const endTimer = (name) => {
    const start = timers.get(name);
    if (start === undefined) return null;
    const duration = performance.now() - start;
    timers.delete(name);
    return duration;
  };

  const getMetrics = () => {
    const uptime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      timers: Object.fromEntries(timers),
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  };

  const reset = () => {
    timers.clear();
  };

  return {
    startTimer,
    endTimer,
    getMetrics,
    reset
  };
}

const performanceMonitor = createPerformanceMonitor();

/**
 * Express Middleware for Performance Telemetry
 */
const performanceMiddleware = (req, res, next) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const memoryUsage = process.memoryUsage();
    
    logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration.toFixed(2)}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      memory: {
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2)
      }
    });
  });
  
  next();
};

module.exports = { performanceMiddleware, performanceMonitor };
