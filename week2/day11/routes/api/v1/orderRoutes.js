'use strict';

const express = require('express');
const router = express.Router();
const Order = require('../../../../day10/models/Order');
const Product = require('../../../../day10/models/Product');
const { authMiddleware, authorize } = require('../../../middleware/auth');
const { AppError } = require('../../../middleware/errorHandler');

// All order routes require authentication
router.use(authMiddleware);

// POST /api/v1/orders - Place a new order (Protected)
router.post('/', async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      throw new AppError('Items array and shippingAddress are required', 400);
    }

    let calculatedTotal = 0;
    const processedItems = [];

    // Verify stock and fetch fresh prices
    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId || !quantity || quantity <= 0) {
        throw new AppError('Valid productId and positive quantity are required for each item', 400);
      }

      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError(`Product not found: ${productId}`, 404);
      }

      if (product.stock < quantity) {
        throw new AppError(`Insufficient stock for product ${product.name} (Available: ${product.stock})`, 400);
      }

      // Decrement product inventory stock
      await Product.update(productId, { stock: product.stock - quantity });

      calculatedTotal += parseFloat(product.price) * parseInt(quantity);
      processedItems.push({
        productId,
        price: product.price,
        quantity
      });
    }

    // Place the order (executed within PG transaction in Model)
    const order = await Order.create({
      customerId: req.user.userId,
      items: processedItems,
      shippingAddress,
      total: parseFloat(calculatedTotal.toFixed(2))
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders - Get user orders (or all orders for Admin)
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, status, customerId } = req.query;
    
    const filters = {};
    if (req.user.role !== 'admin') {
      // Standard users can only retrieve their own orders
      filters.customerId = req.user.userId;
    } else {
      if (customerId) filters.customerId = customerId;
      if (status) filters.status = status;
    }

    const options = { page, limit };
    const ordersList = await Order.findAll(filters, options);

    res.json({
      success: true,
      data: ordersList
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id - Get order details
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Standard user can only access their own order
    if (req.user.role !== 'admin' && order.customer_id !== req.user.userId) {
      throw new AppError('Forbidden access to this order details', 403);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw new AppError('Status parameter is required', 400);
    }

    const order = await Order.updateStatus(req.params.id, status);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
