'use strict';

const express = require('express');
const router = express.Router();
const passport = require('../middleware/oauth');
const { authService, authenticate } = require('../middleware/auth');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account and return JWT access and refresh tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               role:
 *                 type: string
 *                 enum: [user, admin, moderator]
 *                 default: user
 *                 example: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticate a user with email and password, returning JWT access and refresh tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token and refresh token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenRefreshResponse'
 *       400:
 *         description: Refresh token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out user
 *     description: Invalidate/logout user session. Requires Bearer access token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Google OAuth login trigger
 *     description: Redirects user to Google OAuth consent screen.
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
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

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Facebook OAuth login trigger
 *     description: Redirects user to Facebook OAuth consent screen.
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Facebook
 */
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

/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: GitHub OAuth login trigger
 *     description: Redirects user to GitHub OAuth consent screen.
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to GitHub
 */
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

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get profile of logged-in user
 *     description: Retrieve details of the currently authenticated user. Requires Bearer access token.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the password of the currently authenticated user. Requires Bearer access token.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Missing fields or invalid password format or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    // Fetch user explicitly selecting the password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify existing password
    const isCurrentPasswordValid = await authService.comparePassword(
      currentPassword, 
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Validate new password rules
    await authService.validatePassword(newPassword);

    // Update password (hashing is handled by User model pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
