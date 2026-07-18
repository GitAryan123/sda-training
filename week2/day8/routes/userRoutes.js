'use strict';

const express = require('express');
const userService = require('../services/userService');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.authenticateUser(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(req.query);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.patch('/:userId', auth, async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.params.userId, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', auth, async (req, res, next) => {
  try {
    const result = await userService.logout(req.user.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
