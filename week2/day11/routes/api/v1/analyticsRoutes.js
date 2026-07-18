'use strict';

const express = require('express');
const router = express.Router();
const User = require('../../../../day10/models/User');
const Product = require('../../../../day10/models/Product');
const Order = require('../../../../day10/models/Order');
const { authMiddleware, authorize } = require('../../../middleware/auth');

// All analytics routes are admin-only
router.use(authMiddleware);
router.use(authorize('admin'));

// GET /api/v1/analytics - High-level multi-database stats
router.get('/', async (req, res, next) => {
  try {
    // 1. Fetch user role distribution statistics from MongoDB
    const userStats = await User.getUserStats();

    // 2. Fetch product catalog summary statistics from PostgreSQL
    const productStats = await Product.getStats();

    // 3. Fetch product category breakout statistics from PostgreSQL
    const categoryStats = await Product.getCategoryStats();

    // 4. Fetch orders revenue statistics from PostgreSQL
    let orderStats = { total_orders: 0, gross_revenue: 0 };
    try {
      orderStats = await Order.getStats();
    } catch (err) {
      console.warn('Orders tables not ready or empty. Returning default order metrics.', err.message);
    }

    res.json({
      success: true,
      data: {
        users: {
          rolesBreakdown: userStats,
          totalRegistered: userStats.reduce((sum, role) => sum + role.count, 0)
        },
        catalog: {
          metrics: {
            totalProducts: parseInt(productStats.total_products),
            averagePrice: parseFloat(productStats.average_price).toFixed(2),
            minPrice: parseFloat(productStats.min_price).toFixed(2),
            maxPrice: parseFloat(productStats.max_price).toFixed(2),
            totalStock: parseInt(productStats.total_stock)
          },
          categoryBreakdown: categoryStats
        },
        sales: {
          totalOrders: parseInt(orderStats.total_orders || 0),
          grossRevenue: parseFloat(orderStats.gross_revenue || 0).toFixed(2),
          averageOrderValue: parseFloat(orderStats.average_order_value || 0).toFixed(2),
          statusBreakdown: {
            pending: parseInt(orderStats.pending_count || 0),
            confirmed: parseInt(orderStats.confirmed_count || 0),
            shipped: parseInt(orderStats.shipped_count || 0),
            delivered: parseInt(orderStats.delivered_count || 0),
            cancelled: parseInt(orderStats.cancelled_count || 0)
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
