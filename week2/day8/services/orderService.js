'use strict';

const { logger } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * OrderService — manages order lifecycle with EventEmitter pattern.
 * Uses in-memory Map as the data store (Week 2 Day 9 will swap in MongoDB).
 */
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

class OrderService extends EventEmitter {
  constructor() {
    super();
    this.orders = new Map();
  }

  async initialize() {
    this.setupEventHandlers();
    logger.info('OrderService initialized');
  }

  setupEventHandlers() {
    this.on('order:created', (order) => {
      logger.info(`Order created: ${order.id}`, { customerId: order.customerId, total: order.total });
    });
    this.on('order:statusChanged', ({ orderId, from, to }) => {
      logger.info(`Order ${orderId} status: ${from} → ${to}`);
    });
  }

  async createOrder(orderData) {
    const { customerId, items } = orderData;

    if (!customerId || !items || items.length === 0) {
      throw new AppError('customerId and at least one item are required', 400, 'VALIDATION_ERROR');
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      id: uuidv4(),
      customerId,
      items,
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.orders.set(order.id, order);
    this.emit('order:created', order);
    return order;
  }

  async getOrderById(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    return order;
  }

  async updateOrderStatus(orderId, newStatus) {
    if (!ORDER_STATUSES.includes(newStatus)) {
      throw new AppError(`Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const order = await this.getOrderById(orderId);
    const previousStatus = order.status;

    order.status = newStatus;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    this.emit('order:statusChanged', { orderId, from: previousStatus, to: newStatus });
    return order;
  }

  async getAllOrders(filters = {}) {
    let orders = Array.from(this.orders.values());

    if (filters.status) orders = orders.filter(o => o.status === filters.status);
    if (filters.customerId) orders = orders.filter(o => o.customerId === filters.customerId);

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      orders: orders.slice(skip, skip + limit),
      pagination: { page, limit, total: orders.length, pages: Math.ceil(orders.length / limit) }
    };
  }

  async getOrderSummary() {
    const all = Array.from(this.orders.values());
    const summary = ORDER_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    all.forEach(o => summary[o.status]++);
    return { total: all.length, ...summary };
  }
}

module.exports = new OrderService();
