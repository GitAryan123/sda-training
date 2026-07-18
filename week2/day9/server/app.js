'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import custom middleware from parent folder
const { authMiddleware } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');
const logger = require('../middleware/logger');
const { performanceMiddleware } = require('../middleware/performance');

// Import routes from parent folder
const userRoutes = require('../routes/userRoutes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/orderRoutes');

/**
 * Express application factory.
 * Encapsulates app creation, middleware application, and route setup.
 *
 * @returns {express.Application} The configured Express application instance.
 */
function createExpressApp() {
  const app = express();

  // 1. Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // 2. CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // 3. Compression
  app.use(compression());

  // 4. Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // 5. Logging and telemetry
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));

  // 6. Custom performance telemetry
  app.use(performanceMiddleware);

  // 7. Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 8. Health Check Route
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });

  // 9. API Routes
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);

  // 10. 404 Route handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });

  // 11. Centralized Error Handler (must be registered last!)
  app.use(errorHandler);

  return app;
}

module.exports = createExpressApp;