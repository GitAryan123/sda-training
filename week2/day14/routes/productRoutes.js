'use strict';

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// Browse all products (requires authentication)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.category) {
      filters.category = req.query.category;
    }
    const products = await Product.find(filters);
    res.status(200).json({
      success: true,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific product by ID (requires authentication)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
