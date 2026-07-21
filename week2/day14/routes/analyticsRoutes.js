'use strict';

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

// Get analytics overview (requires authentication)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Aggregate total sales
    const salesAggregation = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
    ]);
    const totalSales = salesAggregation.length > 0 ? salesAggregation[0].totalSales : 0;

    // Aggregate category distribution from products
    const categoryAggregation = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalSales,
        categories: categoryAggregation.map(cat => ({ category: cat._id, count: cat.count })),
        performanceSummary: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage().heapUsed
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
