'use strict';

const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validateOrder, validateId, validatePagination } = require('../middleware/validation');
const { createAppError } = require('../middleware/errorHandler');

// All order routes require authentication
router.use(authMiddleware);

// GET /api/orders/summary - Order revenue and breakdown (Admin only)
// Note: Register this BEFORE the :id route to avoid routing conflicts!
router.get('/summary', authorize('admin'), async (req, res, next) => {
  try {
    const summary = await orderService.getOrderSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Place a new order
router.post('/', validateOrder, async (req, res, next) => {
  try {
    const orderData = {
      customerId: req.user.userId,
      items: req.body.items,
      shippingAddress: req.body.shippingAddress
    };

    const order = await orderService.createOrder(orderData);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders - List user orders (or all orders for Admin)
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, status, customerId } = req.query;
    
    const filters = {};
    if (req.user.role !== 'admin') {
      // Regular users can only see their own orders
      filters.customerId = req.user.userId;
    } else {
      // Admin can filter by customerId
      if (customerId) filters.customerId = customerId;
      if (status) filters.status = status;
    }

    const options = { page, limit };
    const result = await orderService.getAllOrders(filters, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Get order details
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    // Regular users can only retrieve their own orders
    if (req.user.role !== 'admin' && order.customerId !== req.user.userId) {
      throw createAppError('Access denied: not your order', 403);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', validateId, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw createAppError('Status field is required', 400);
    }

    const order = await orderService.updateOrderStatus(req.params.id, status);
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
