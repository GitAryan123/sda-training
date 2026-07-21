'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('../middleware/oauth');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/orderRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');
const { errorHandler } = require('../middleware/errorHandler');
const { setupSwagger } = require('../middleware/swagger');
const { monitoringMiddleware, healthCheck, metrics } = require('../middleware/monitoring');

function createExpressApp() {
  const app = express();

  // Basic security configurations
  app.use(helmet());
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Early request logging and performance profiling middleware
  app.use(monitoringMiddleware);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Required session configuration for social logins
  app.use(session({
    secret: process.env.SESSION_SECRET || 'sda-auth-session-fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Initializing Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Swagger API Documentation
  setupSwagger(app);

  // System monitoring and health endpoints
  app.get('/api/v1/health', healthCheck);
  app.get('/api/v1/metrics', metrics);

  // Mount API routers
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  // Fallback route
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  // Global Error handling
  app.use(errorHandler);

  return app;
}

module.exports = createExpressApp;

