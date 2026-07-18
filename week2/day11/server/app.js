'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const { apiVersioning } = require('../middleware/apiVersioning');
const { generalLimiter } = require('../middleware/rateLimiting');
const { errorHandler } = require('../middleware/errorHandler');
const logger = require('../middleware/logger');

// Route modules
const apiV1Routes = require('../routes/api/v1');

// Swagger imports
const { specs, swaggerUi } = require('../docs/swagger');

function createExpressApp() {
  const app = express();

  // 1. Helmet Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // 2. CORS setup
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-API-Key']
  }));

  // 3. Response Compression
  app.use(compression());

  // 4. Rate Limiting (Global for API paths)
  app.use('/api/', generalLimiter);

  // 5. Morgan Logging Integration
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));

  // 6. Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 7. Swagger API Documentation Page (v1)
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs));

  // 8. Versioned Routers (via Version Negotiation Middleware)
  app.use('/api', apiVersioning, (req, res, next) => {
    if (req.apiVersion === 'v1') {
      return apiV1Routes(req, res, next);
    }
    next();
  });

  // 9. Root & Info checks
  app.get('/', (req, res) => {
    res.redirect('/api/v1/docs');
  });

  // 10. 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
      path: req.originalUrl
    });
  });

  // 11. Central Error middleware
  app.use(errorHandler);

  return app;
}

module.exports = createExpressApp;
