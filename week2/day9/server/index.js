'use strict';

const dotenv = require('dotenv');
dotenv.config();

const createExpressApp = require('./app');
const { logger } = require('../middleware/errorHandler');

const port = process.env.PORT || 3000;

try {
  const app = createExpressApp();
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`, {
      env: process.env.NODE_ENV || 'development',
      pid: process.pid
    });
  });
} catch (error) {
  logger.error('Failed to start Express application', { error: error.message, stack: error.stack });
  process.exit(1);
}
