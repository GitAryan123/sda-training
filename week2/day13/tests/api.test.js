'use strict';

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// Default test variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'day12-test-jwt-secret-key-string';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const request = require('supertest');
const mongodb = require('../database/mongodb');
const User = require('../models/User');
const createExpressApp = require('../server/app');

describe('SDA Auth API Endpoints Suite', () => {
  let app;
  let authToken;
  let refreshToken;
  
  const testUserEmail = 'api-test-user@test.dev';
  const testUserPassword = 'SecurePassword123!';
  const testUserName = 'API Test User';

  beforeAll(async () => {
    // Connect database
    await mongodb.connect();
    // Clear preexisting test data
    await User.deleteMany({ email: /@test\.dev$/ });
    
    // Initialize Express application
    app = createExpressApp();
  });

  afterAll(async () => {
    // Clean up database records
    await User.deleteMany({ email: /@test\.dev$/ });
    // Terminate DB connection
    await mongodb.disconnect();
  });

  describe('POST /auth/register', () => {
    test('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: testUserName,
          email: testUserEmail,
          password: testUserPassword,
          role: 'user'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUserEmail);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    test('should fail to register user with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-user@test.dev'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    test('should fail to register when user already exists', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: testUserName,
          email: testUserEmail,
          password: testUserPassword
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    test('should successfully authenticate user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Store tokens for subsequent authenticated requests
      authToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    test('should fail to authenticate user with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'IncorrectPassword123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    test('should fail to authenticate user with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'does-not-exist@test.dev',
          password: testUserPassword
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('GET /auth/me', () => {
    test('should retrieve current user profile when given valid authorization token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe(testUserEmail);
      expect(res.body.data.name).toBe(testUserName);
    });

    test('should reject profile lookup without auth token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Access token is required');
    });

    test('should reject profile lookup with malformed header', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `InvalidScheme ${authToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Access token is required');
    });
  });

  describe('POST /auth/refresh', () => {
    test('should successfully issue new tokens when given valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed successfully');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Rotate tokens
      authToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    test('should reject token refresh when token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Refresh token is required');
    });
  });

  describe('PUT /auth/change-password', () => {
    test('should successfully update password with valid payload', async () => {
      const res = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');
    });

    test('should fail password update if current password matches incorrectly', async () => {
      const res = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'AnotherPassword123!'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Current password is incorrect');
    });
  });

  describe('POST /auth/logout', () => {
    test('should successfully complete logout request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});
