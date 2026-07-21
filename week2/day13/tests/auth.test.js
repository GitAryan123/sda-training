'use strict';

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// Ensure test JWT keys are defined
process.env.JWT_SECRET = process.env.JWT_SECRET || 'day12-test-jwt-secret-key-string';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const request = require('supertest');
const mongodb = require('../database/mongodb');
const User = require('../models/User');
const { authService } = require('../middleware/auth');
const { hasPermission, PERMISSIONS } = require('../middleware/rbac');
const createExpressApp = require('../server/app');

async function runTests() {
  console.log('=== Starting Day 12 Auth & RBAC Integration Tests ===');

  let dbConnected = false;

  // 1. Connect MongoDB
  try {
    await mongodb.connect();
    dbConnected = true;
    console.log('✔ MongoDB connection verified.');
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed. Skipping route-level tests.', err.message);
  }

  // 2. Test Password Validation Service
  console.log('\n[Test 1] Testing Password Validation rules...');
  try {
    await authService.validatePassword('weak');
    throw new Error('Weak password was incorrectly validated');
  } catch (err) {
    if (err.message !== 'Password validation failed') {
      throw err;
    }
    console.log('✔ Correctly rejected short password.');
  }

  try {
    await authService.validatePassword('SecurePassword123!');
    console.log('✔ Correctly accepted strong password.');
  } catch (err) {
    throw new Error('Valid password was incorrectly rejected: ' + err.message);
  }

  // 3. Test JWT signing and verification
  console.log('\n[Test 2] Testing JWT Service...');
  const fakeUser = {
    _id: '6a5b4f8489cda74408454db4',
    email: 'auth-tester@sda.dev',
    role: 'moderator'
  };

  const tokens = await authService.generateTokens(fakeUser);
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('Token generation failed');
  }
  console.log('✔ Generated access and refresh token pair.');

  const decoded = await authService.verifyToken(tokens.accessToken);
  if (decoded.role !== 'moderator' || decoded.email !== 'auth-tester@sda.dev') {
    throw new Error('Token verification payload mismatch');
  }
  console.log('✔ Verified access token and decoded payload correctly.');

  // 4. Test RBAC permissions matrix logic
  console.log('\n[Test 3] Testing RBAC Permission checks...');
  const adminUser = { role: 'admin' };
  const userUser = { role: 'user' };

  if (!hasPermission(adminUser, 'users:write')) {
    throw new Error('Admin should have write permissions');
  }
  if (hasPermission(userUser, 'users:write')) {
    throw new Error('User should not have write permissions');
  }
  if (!hasPermission(userUser, 'products:read')) {
    throw new Error('User should have product read permissions');
  }
  console.log('✔ RBAC permission rules resolved correctly.');

  // 5. Test Router level endpoints (Requires DB)
  if (dbConnected) {
    console.log('\n[Test 4] Testing Express Auth Routes...');
    const app = createExpressApp();

    // Clean up test account if existing
    const testEmail = `auth-test-${Date.now()}@apex.dev`;
    await User.deleteMany({ email: /@apex\.dev$/ });

    console.log('  Registering user with strong password...');
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Auth Test User',
        email: testEmail,
        password: 'Password123!',
        role: 'moderator'
      })
      .expect(201);
    
    const regTokens = regRes.body.data;
    if (!regTokens.accessToken || !regTokens.refreshToken) {
      throw new Error('No tokens returned on registration');
    }
    console.log('✔ Registration endpoint returned user and tokens.');

    console.log('  Logging in with valid credentials...');
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!'
      })
      .expect(200);

    const loginTokens = loginRes.body.data;
    console.log('✔ Login endpoint returned tokens.');

    console.log('  Querying /me details (Protected path)...');
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginTokens.accessToken}`)
      .expect(200);

    if (meRes.body.data.email !== testEmail || meRes.body.data.role !== 'moderator') {
      throw new Error('Profile lookup returned incorrect user context');
    }
    console.log('✔ Profile details fetched correctly.');

    console.log('  Testing Refresh Token Rotation...');
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: loginTokens.refreshToken
      })
      .expect(200);

    if (!refreshRes.body.data.accessToken || !refreshRes.body.data.refreshToken) {
      throw new Error('Token rotation did not return new tokens');
    }
    console.log('✔ Refresh token rotation completed successfully.');

    // Clean up test user
    await User.deleteMany({ email: testEmail });
  }

  // Teardown connections
  console.log('\n=== Disconnecting database connections... ===');
  if (dbConnected) {
    await mongodb.disconnect();
  }

  console.log('\n=== Day 12 Auth & RBAC Integration Tests Finished ===');
}

runTests().catch(err => {
  console.error('❌ Integration tests failed:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
