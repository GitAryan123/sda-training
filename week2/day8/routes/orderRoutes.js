'use strict';

const express = require('express');
const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrders(req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', auth, async (req, res, next) => {
  try {
    const summary = await orderService.getOrderSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/:orderId', auth, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.orderId);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    notificationService.broadcast('order:created', order);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

router.patch('/:orderId/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.orderId, status);
    notificationService.broadcast('order:updated', order);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
