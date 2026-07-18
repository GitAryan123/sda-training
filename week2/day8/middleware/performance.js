'use strict';

const { performance } = require('perf_hooks');
const { logger } = require('./errorHandler');

/**
 * PerformanceMonitor — tracks named timers and aggregates process-level
 * metrics (heap, RSS, uptime, event loop lag).
 */
class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
    this.startedAt = Date.now();
  }

  /** Start a named timer. Call endTimer() with the same name to record duration. */
  startTimer(name) {
    this.timers.set(name, performance.now());
  }

  /** End a named timer. Returns duration in ms, or -1 if timer was never started. */
  endTimer(name) {
    const start = this.timers.get(name);
    if (start === undefined) return -1;
    const duration = performance.now() - start;
    this.timers.delete(name);
    return duration;
  }

  /** Record stats from a completed request (called by the middleware). */
  recordRequest(durationMs, isError) {
    this.requestCount++;
    this.totalResponseTime += durationMs;
    if (isError) this.errorCount++;
  }

  /** Return a snapshot of all performance metrics. */
  getSnapshot() {
    const mem = process.memoryUsage();
    const uptimeMs = Date.now() - this.startedAt;

    return {
      server: {
        uptimeMs,
        uptimeHuman: formatDuration(uptimeMs),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        avgResponseMs: this.requestCount > 0
          ? Math.round(this.totalResponseTime / this.requestCount)
          : 0
      },
      memory: {
        rssBytes: mem.rss,
        heapTotalBytes: mem.heapTotal,
        heapUsedBytes: mem.heapUsed,
        heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2)
      }
    };
  }

  /** Reset counters (useful for rolling windows in tests). */
  reset() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
    this.startedAt = Date.now();
  }
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s % 60}s`;
}

/** Singleton instance shared across the app */
const monitor = new PerformanceMonitor();

/**
 * Express middleware — measures request duration, records stats, logs every
 * completed request with method, path, status, and timing.
 */
function performanceMiddleware(req, res, next) {
  const start = performance.now();

  // Hook into the response 'finish' event so we capture the final status code
  res.on('finish', () => {
    const durationMs = performance.now() - start;
    const isError = res.statusCode >= 400;

    monitor.recordRequest(durationMs, isError);

    const logFn = isError ? logger.warn : logger.info;
    logFn(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      durationMs: durationMs.toFixed(2),
      contentLength: res.get('Content-Length') || 0
    });
  });

  next();
}

module.exports = { performanceMiddleware, monitor };