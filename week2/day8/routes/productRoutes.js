'use strict';

const express = require('express');
const productService = require('../services/productService');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

router.get('/:productId', async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.productId);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.patch('/:productId', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.productId, req.body);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.delete('/:productId', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.productId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
