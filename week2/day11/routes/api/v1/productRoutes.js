'use strict';

const express = require('express');
const router = express.Router();
const Product = require('../../../../day10/models/Product');
const { authMiddleware, authorize } = require('../../../middleware/auth');
const { cache, cacheService } = require('../../../middleware/caching');
const { AppError } = require('../../../middleware/errorHandler');

/**
 * Public Routes
 */

// GET /api/v1/products - Query catalog (Cached for 5 mins / 300s)
router.get('/', cache(300), async (req, res, next) => {
  try {
    const { page, limit, sort, order, category, search, minPrice, maxPrice } = req.query;
    
    const filters = { category, search, minPrice, maxPrice };
    const options = {
      page: page || 1,
      limit: limit || 10,
      sortBy: sort || 'created_at',
      sortOrder: order || 'desc'
    };

    const products = await Product.findAll(filters, options);
    const stats = await Product.getStats();

    res.json({
      success: true,
      data: {
        products,
        total: parseInt(stats.total_products),
        page: parseInt(options.page),
        limit: parseInt(options.limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id - Product detail (Cached for 1 hour / 3600s)
router.get('/:id', cache(3600), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Admin Only Routes
 */
router.use(authMiddleware);
router.use(authorize('admin'));

// POST /api/v1/products - Create product (Invalidates cache)
router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, category, stock, imageUrl, tags } = req.body;
    
    if (!name || !description || price === undefined || !category) {
      throw new AppError('Missing required fields for product', 400);
    }

    const product = await Product.create({
      name, description, price, category, stock, imageUrl, tags
    });

    // Invalidate product caches
    await cacheService.flush();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/products/:id - Update product (Invalidates cache)
router.put('/:id', async (req, res, next) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Invalidate product caches
    await cacheService.flush();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/products/:id - Delete product (Invalidates cache)
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.delete(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Invalidate product caches
    await cacheService.flush();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
