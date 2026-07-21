'use strict';

const express = require('express');
const router = express.Router();
const passport = require('../middleware/oauth');
const { authService, authenticate } = require('../middleware/auth');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// POST /register - Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    // Validate password rules
    await authService.validatePassword(password);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create user (hashing is handled by User model pre-save hook)
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate tokens
    const tokens = await authService.generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /login - User login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password using AuthService
    const isPasswordValid = await authService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await authService.generateTokens(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /refresh - Refresh accessToken
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
});

// POST /logout - Logout user
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Statelessly complete logout (token blacklist can be attached here in production)
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth Login Trigger
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth Callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res, next) => {
    try {
      const tokens = await authService.generateTokens(req.user);
      
      res.json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          ...tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Facebook OAuth Login Trigger
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email']
}));

// Facebook OAuth Callback
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res, next) => {
    try {
      const tokens = await authService.generateTokens(req.user);
      
      res.json({
        success: true,
        message: 'Facebook authentication successful',
        data: {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          ...tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GitHub OAuth Login Trigger
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

// GitHub OAuth Callback
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res, next) => {
    try {
      const tokens = await authService.generateTokens(req.user);
      
      res.json({
        success: true,
        message: 'GitHub authentication successful',
        data: {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          ...tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /me - Get currently logged-in user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /change-password - Change user password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    // Verify existing password
    const isCurrentPasswordValid = await authService.comparePassword(
      currentPassword, 
      req.user.password
    );
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Validate new password rules
    await authService.validatePassword(newPassword);

    // Update password (hashing is handled by User model pre-save hook)
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
