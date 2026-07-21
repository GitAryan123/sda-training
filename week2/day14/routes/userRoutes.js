'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// Get all users (restricted to Admin)
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile by ID (requires authentication, accessible by owner or Admin)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update user details by ID (requires authentication, accessible by owner or Admin)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    const { name, preferences, profile } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
