'use strict';

// Load environment configuration
const dotenv = require('dotenv');
dotenv.config();

const createExpressApp = require('./app');
const mongodb = require('../../day10/database/mongodb');
const postgresql = require('../../day10/database/postgresql');
const { cacheService } = require('../middleware/caching');
const logger = require('../middleware/logger');

const port = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Connect MongoDB
    await mongodb.connect();
    
    // 2. Connect PostgreSQL
    try {
      await postgresql.connect();
    } catch (pgErr) {
      logger.warn('[Bootstrap] PostgreSQL failed to connect. Running in degraded state.');
    }

    // 3. Connect Redis cache
    try {
      await cacheService.connect();
    } catch (redisErr) {
      logger.warn('[Bootstrap] Redis cache failed to connect. Caching will be disabled.');
    }

    // 4. Initialize Express Server
    const app = createExpressApp();
    app.listen(port, () => {
      logger.info(`[Server] REST API successfully initialized on port ${port}`, {
        env: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
    });

  } catch (error) {
    logger.error('[Bootstrap] Failed during initialization', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

bootstrap();
