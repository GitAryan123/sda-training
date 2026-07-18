'use strict';

const express = require('express');
const router = express.Router();
const User = require('../../../../day10/models/User');
const { authMiddleware } = require('../../../middleware/auth');
const { loginLimiter } = require('../../../middleware/rateLimiting');
const { AppError } = require('../../../middleware/errorHandler');

// POST /api/v1/users/register - Create a new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const user = await User.create({ name, email, password });
    
    // Generate auth token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users/login - Authenticate user
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Static helper method on model from Day 10
    const user = await User.findByCredentials(email, password);
    
    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    // Override standard error message slightly to avoid credential leak warnings
    next(new AppError('Invalid email or password', 401));
  }
});

// GET /api/v1/users/profile - Get profile of authenticated user
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        preferences: user.preferences,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
