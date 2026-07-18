const express = require('express');
const cluster = require('cluster');
const os = require('os');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const userService = require('../services/userService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');

const { errorHandler, logger } = require('../middleware/errorHandler');
const { performanceMiddleware } = require('../middleware/performance');

const userRoutes = require('../routes/userRoutes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/orderRoutes');
const healthRoutes = require('../routes/healthRoutes');

class Application {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.port = process.env.PORT || 3000;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  async initialize() {
    try {
      this.setupMiddleware();
      this.setupRoutes();
      await this.setupServices();
      this.setupWebSocket();
      this.setupErrorHandling();
      this.startServer();
    } catch (error) {
      logger.error('Application initialization failed', { error: error.message });
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request performance instrumentation
    this.app.use(performanceMiddleware);
  }

  setupRoutes() {
    // Health check
    this.app.use('/health', healthRoutes);

    // API routes
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/orders', orderRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });
  }

  async setupServices() {
    await Promise.all([
      userService.initialize(),
      productService.initialize(),
      orderService.initialize(),
      notificationService.initialize()
    ]);

    logger.info('All services initialized successfully');
  }

  setupWebSocket() {
    notificationService.attachIO(this.io);

    this.io.on('connection', (socket) => {
      logger.info('Socket connected', { socketId: socket.id });

      socket.on('join', (room) => {
        socket.join(room);
        logger.info('Socket joined room', { socketId: socket.id, room });
      });

      socket.on('disconnect', () => {
        logger.info('Socket disconnected', { socketId: socket.id });
      });

      // Basic event bridge for demo purposes
      socket.on('user:update', (data) => {
        notificationService.broadcast('user:updated', data);
      });

      socket.on('order:create', (data) => {
        notificationService.broadcast('order:created', data);
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: String(reason),
        promise: String(promise)
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  startServer() {
    this.server.listen(this.port, () => {
      logger.info('Server started', {
        port: this.port,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
    });
  }
}

// Enable cluster in production, single process in local dev.
const shouldCluster = process.env.CLUSTER_MODE === 'true' || process.env.NODE_ENV === 'production';

if (shouldCluster && cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  logger.info('Primary cluster process started', { pid: process.pid, workers: cpuCount });

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn('Worker exited, restarting', {
      workerPid: worker.process.pid,
      code,
      signal
    });
    cluster.fork();
  });

  process.on('SIGTERM', () => {
    logger.info('Primary received SIGTERM, shutting down workers');
    Object.values(cluster.workers).forEach((worker) => {
      if (worker) worker.kill();
    });
    process.exit(0);
  });
} else {
  const app = new Application();
  app.initialize();
}