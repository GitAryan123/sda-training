'use strict';

const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validateProduct, validateId, validatePagination } = require('../middleware/validation');

/**
 * Public Routes
 */

// GET /api/products - Get all products with filters & pagination
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, sort, order, category, search } = req.query;
    const filters = { category, search };
    const options = { page, limit, sort, order };

    const result = await productService.getAllProducts(filters, options);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Get product details by ID
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Protected Routes (Admin Only)
 */
router.use(authMiddleware);
router.use(authorize('admin'));

// POST /api/products - Create a new product
router.post('/', validateProduct, async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update product by ID
router.put('/:id', validateId, validateProduct, async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Delete product by ID
router.delete('/:id', validateId, async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
