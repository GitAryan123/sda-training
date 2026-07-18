'use strict';

const winston = require('winston');
const path = require('path');

const logDir = 'logs';

function createLogger() {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'day11-api' },
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
            if (Object.keys(metadata).length > 0) {
              const { service, ...rest } = metadata;
              if (Object.keys(rest).length > 0) {
                metaString = ` ${JSON.stringify(rest)}`;
              }
            }
            return `[${timestamp}] ${level}: ${message}${metaString}`;
          })
        )
      })
    ]
  });
}

module.exports = createLogger();
