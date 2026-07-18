'use strict';

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const productService = require('./productService');
const { AppError } = require('../middleware/errorHandler');

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

/**
 * Order Service Factory
 * Returns a configured order service singleton using closures and EventEmitter.
 */
function createOrderService() {
  const emitter = new EventEmitter();
  const orders = new Map();

  // Listen to order events for tracking/telemetry
  emitter.on('order:created', (order) => {
    console.log(`[Event] Order created: ${order.id} for Customer: ${order.customerId} - Total: $${order.total}`);
  });

  emitter.on('order:statusChanged', ({ orderId, from, to }) => {
    console.log(`[Event] Order ${orderId} status changed: ${from} -> ${to}`);
  });

  const createOrder = async (orderData) => {
    const { customerId, items, shippingAddress } = orderData;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      throw new AppError('customerId, items list, and shippingAddress are required', 400);
    }

    let calculatedTotal = 0;
    const processedItems = [];

    // Verify product existence, check/update stock, build items list
    for (const item of items) {
      const { productId, quantity } = item;
      const product = await productService.getProductById(productId);

      if (product.stock < quantity) {
        throw new AppError(`Insufficient stock for product ${product.name} (Available: ${product.stock})`, 400);
      }

      // Decrement stock
      await productService.updateProduct(productId, { stock: product.stock - quantity });

      calculatedTotal += product.price * quantity;
      processedItems.push({
        productId,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    const order = {
      id: uuidv4(),
      customerId,
      items: processedItems,
      shippingAddress,
      total: parseFloat(calculatedTotal.toFixed(2)),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.set(order.id, order);
    emitter.emit('order:created', order);

    return order;
  };

  const getOrderById = async (orderId) => {
    const order = orders.get(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!ORDER_STATUSES.includes(newStatus)) {
      throw new AppError(`Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`, 400);
    }

    const order = orders.get(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date();

    orders.set(orderId, order);
    emitter.emit('order:statusChanged', { orderId, from: previousStatus, to: newStatus });

    return order;
  };

  const getAllOrders = async (filters = {}, options = {}) => {
    let orderList = Array.from(orders.values());

    if (filters.status) {
      orderList = orderList.filter(o => o.status === filters.status);
    }
    if (filters.customerId) {
      orderList = orderList.filter(o => o.customerId === filters.customerId);
    }

    // Sort options
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    const total = orderList.length;
    const paginatedOrders = orderList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  };

  const getOrderSummary = async () => {
    const all = Array.from(orders.values());
    const summary = ORDER_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    all.forEach(o => {
      summary[o.status]++;
    });
    return {
      totalOrders: all.length,
      revenue: parseFloat(all.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0).toFixed(2)),
      breakdown: summary
    };
  };

  return {
    on: emitter.on.bind(emitter),
    createOrder,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
    getOrderSummary
  };
}

module.exports = createOrderService();
