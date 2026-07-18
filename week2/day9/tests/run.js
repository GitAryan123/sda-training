'use strict';

const request = require('supertest');
const createExpressApp = require('../server/app');

async function runTests() {
  console.log('=== Starting Day 9 Verification Tests ===');
  const app = createExpressApp();
  
  let adminToken = '';
  let userToken = '';
  let userId = '';
  let testProductId = '';
  let testOrderId = '';

  // 1. Verify Health check
  console.log('\n[Test 1] Health Check...');
  const healthRes = await request(app)
    .get('/health')
    .expect(200);
  
  if (healthRes.body.status !== 'OK') {
    throw new Error('Health check status is not OK');
  }
  console.log('✔ Health Check passed');

  // 2. Seed and fetch products publicly
  console.log('\n[Test 2] Public product listing...');
  const productsRes = await request(app)
    .get('/api/products')
    .expect(200);

  const productData = productsRes.body.data.products;
  if (!Array.isArray(productData) || productData.length === 0) {
    throw new Error('No seeded products returned');
  }
  testProductId = productData[0].id;
  console.log(`✔ Public product listing passed. Found product ID: ${testProductId}`);

  // 3. User Register
  console.log('\n[Test 3] User registration...');
  const registerRes = await request(app)
    .post('/api/users/register')
    .send({
      name: 'Test User',
      email: 'testuser@apex.dev',
      password: 'SecurePassword123!'
    })
    .expect(201);

  userId = registerRes.body.data.id;
  if (!userId) {
    throw new Error('User ID was not returned');
  }
  console.log(`✔ Registration passed. User ID: ${userId}`);

  // 4. User Login (Standard)
  console.log('\n[Test 4] User login...');
  const loginRes = await request(app)
    .post('/api/users/login')
    .send({
      email: 'testuser@apex.dev',
      password: 'SecurePassword123!'
    })
    .expect(200);

  userToken = loginRes.body.data.token;
  if (!userToken) {
    throw new Error('Standard token was not returned');
  }
  console.log('✔ Standard login passed');

  // 5. Admin Login (Seeded)
  console.log('\n[Test 5] Admin login...');
  const adminLoginRes = await request(app)
    .post('/api/users/login')
    .send({
      email: 'admin@apex.dev',
      password: 'admin1234'
    })
    .expect(200);

  adminToken = adminLoginRes.body.data.token;
  if (!adminToken) {
    throw new Error('Admin token was not returned');
  }
  console.log('✔ Admin login passed');

  // 6. User Profile Retrieval
  console.log('\n[Test 6] User profile retrieval (Authenticated)...');
  const profileRes = await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${userToken}`)
    .expect(200);

  if (profileRes.body.data.email !== 'testuser@apex.dev') {
    throw new Error('Profile details do not match');
  }
  console.log('✔ Profile retrieval passed');

  // 7. Input validation triggers
  console.log('\n[Test 7] Input validation triggers (Register invalid email)...');
  const invalidRegRes = await request(app)
    .post('/api/users/register')
    .send({
      name: 'a',
      email: 'bad-email',
      password: '123'
    })
    .expect(400);

  if (!invalidRegRes.body.error || invalidRegRes.body.error.code !== 'VALIDATION_ERROR') {
    throw new Error('Expected validation error block missing');
  }
  console.log('✔ Input validation triggered correctly');

  // 8. Place order
  console.log('\n[Test 8] Place order...');
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      items: [
        { productId: testProductId, quantity: 2 }
      ],
      shippingAddress: {
        street: '123 Apex Way',
        city: 'San Jose',
        zipCode: '95112' // US postal code validation
      }
    })
    .expect(201);

  testOrderId = orderRes.body.data.id;
  console.log(`✔ Order placed successfully. Order ID: ${testOrderId}`);

  // 9. Admin order summary
  console.log('\n[Test 9] Retrieve order summary (Admin only)...');
  const summaryRes = await request(app)
    .get('/api/orders/summary')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  if (summaryRes.body.data.totalOrders === 0) {
    throw new Error('Summary order count should be greater than 0');
  }
  console.log('✔ Order summary retrieved correctly by Admin');

  // 10. Forbidden Access Check
  console.log('\n[Test 10] Forbidden endpoint check (Standard user hits admin route)...');
  await request(app)
    .get('/api/orders/summary')
    .set('Authorization', `Bearer ${userToken}`)
    .expect(403);

  console.log('✔ Non-admin user blocked correctly');

  console.log('\n=== All Tests Passed Successfully! ===');
}

runTests().catch(err => {
  console.error('\n❌ Verification tests failed:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
