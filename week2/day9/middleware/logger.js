'use strict';

const winston = require('winston');
const path = require('path');

// Ensure log directory exists
const logDir = 'logs';

/**
 * Custom Logger Factory
 * Configures and returns a Winston logger instance.
 */
function createLogger() {
  const loggerInstance = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'express-app' },
    transports: [
      new winston.transports.File({ 
        filename: path.join(logDir, 'error.log'), 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log') 
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            let metaString = '';
            if (Object.keys(metadata).length > 0 && metadata.service) {
              // Exclude default meta if needed, or format
              const { service, ...rest } = metadata;
              if (Object.keys(rest).length > 0) {
                metaString = ` ${JSON.stringify(rest)}`;
              }
            } else if (Object.keys(metadata).length > 0) {
              metaString = ` ${JSON.stringify(metadata)}`;
            }
            return `[${timestamp}] ${level}: ${message}${metaString}`;
          })
        )
      })
    ]
  });

  return loggerInstance;
}

module.exports = createLogger();
