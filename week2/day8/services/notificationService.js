'use strict';

const EventEmitter = require('events');
const { logger } = require('../middleware/errorHandler');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.io = null;
  }

  async initialize() {
    this.on('notify', ({ event, payload }) => {
      logger.info('Notification event published', { event });
      if (this.io) {
        this.io.emit(event, payload);
      }
    });

    logger.info('NotificationService initialized');
  }

  attachIO(io) {
    this.io = io;
    logger.info('Socket.io instance attached to NotificationService');
  }

  broadcast(event, payload) {
    this.emit('notify', { event, payload });
  }
}

module.exports = new NotificationService();
