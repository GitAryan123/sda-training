'use strict';

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// Create a new order (requires authentication)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order items are required', 400);
    }
    if (!shippingAddress) {
      throw new AppError('Shipping address is required', 400);
    }

    // Validate products exist and we have enough stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for product ${product.name}`, 400);
      }
      
      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const order = new Order({
      userId: req.user._id,
      items,
      shippingAddress
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// Retrieve orders for the authenticated user (requires authentication)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate('items.productId');
    res.status(200).json({
      success: true,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
