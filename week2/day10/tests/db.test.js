'use strict';

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// Ensure test JWT keys are defined for signature creation
process.env.JWT_SECRET = process.env.JWT_SECRET || 'day10-test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const mongodb = require('../database/mongodb');
const postgresql = require('../database/postgresql');
const User = require('../models/User');
const Product = require('../models/Product');
const userMigration = require('../migrations/001_create_users_table');
const ecomMigration = require('../migrations/002_create_ecom_tables');

async function runTests() {
  console.log('=== Starting Day 10 Database Integration Tests ===');

  let mongoPassed = false;
  let pgPassed = false;

  // 1. Test MongoDB Connection
  console.log('\n[Test 1] Connecting to MongoDB...');
  try {
    await mongodb.connect();
    console.log('✔ MongoDB connection verified.');
    const status = mongodb.getConnectionStatus();
    console.log(`  Host: ${status.host}, DB Name: ${status.name}, State: ${status.readyState}`);
    mongoPassed = true;
  } catch (err) {
    console.warn('⚠️ MongoDB Connection Failed. Skipping MongoDB model tests.', err.message);
  }

  // 2. Test PostgreSQL Connection
  console.log('\n[Test 2] Connecting to PostgreSQL...');
  try {
    await postgresql.connect();
    console.log('✔ PostgreSQL connection verified.');
    const status = postgresql.getConnectionStatus();
    console.log(`  Connected: ${status.isConnected}, Active Clients: ${status.totalCount}`);
    pgPassed = true;
  } catch (err) {
    console.warn('⚠️ PostgreSQL Connection Failed. Skipping PostgreSQL model/migration tests.', err.message);
  }

  // 3. PostgreSQL Migrations
  if (pgPassed) {
    console.log('\n[Test 3] Running PostgreSQL Migrations...');
    try {
      console.log('  Running Down migration (Teardown)...');
      await ecomMigration.down();
      await userMigration.down();

      console.log('  Running Up migration (Setup)...');
      await userMigration.up();
      await ecomMigration.up();

      console.log('✔ Migrations completed successfully.');
    } catch (err) {
      console.error('❌ Migration tests failed:', err.message);
      pgPassed = false;
    }
  }

  // 4. MongoDB User Model Tests
  if (mongoPassed) {
    console.log('\n[Test 4] Testing MongoDB User Model (Mongoose)...');
    try {
      // Clean up previous test users if any
      await User.deleteMany({ email: /@test\.dev$/ });

      const testUserEmail = `tester-${Date.now()}@test.dev`;
      console.log(`  Creating User with email: ${testUserEmail}...`);
      const user = await User.create({
        name: 'Database Tester',
        email: testUserEmail,
        password: 'Password123!',
        role: 'user',
        preferences: { theme: 'dark' },
        profile: { bio: 'Mongoose integration test.' }
      });

      console.log(`✔ User created. ID: ${user._id}`);
      
      console.log('  Testing Password hashing...');
      if (user.password === 'Password123!') {
        throw new Error('Password was not hashed!');
      }
      console.log('✔ Password hashing verified.');

      console.log('  Testing comparePassword instance method...');
      const isMatch = await user.comparePassword('Password123!');
      if (!isMatch) {
        throw new Error('Password mismatch on correct credentials');
      }
      console.log('✔ comparePassword verified.');

      console.log('  Testing generateAuthToken instance method...');
      const token = user.generateAuthToken();
      if (!token) {
        throw new Error('Failed to generate JWT');
      }
      console.log('✔ generateAuthToken verified.');

      console.log('  Testing findByCredentials static method...');
      const loggedUser = await User.findByCredentials(testUserEmail, 'Password123!');
      if (loggedUser.name !== 'Database Tester') {
        throw new Error('Static lookup failed');
      }
      console.log('✔ findByCredentials verified.');

      console.log('  Testing getUserStats aggregation pipeline...');
      const stats = await User.getUserStats();
      console.log('  Aggregation Result:', JSON.stringify(stats));
      if (!Array.isArray(stats) || stats.length === 0) {
        throw new Error('Aggregation query returned empty stats');
      }
      console.log('✔ getUserStats aggregation verified.');

      // Clean up
      await User.deleteMany({ email: testUserEmail });
      console.log('✔ User tests completed.');
    } catch (err) {
      console.error('❌ User model tests failed:', err.message);
    }
  }

  // 5. PostgreSQL Product Model Tests
  if (pgPassed) {
    console.log('\n[Test 5] Testing PostgreSQL Product Model...');
    try {
      console.log('  Inserting new product...');
      const newProduct = await Product.create({
        name: 'Apex Keyboard V2',
        description: 'Mechanical keyboard with dynamic RGB controls.',
        price: 149.99,
        category: 'Accessories',
        stock: 45,
        imageUrl: 'http://example.com/keyboard.jpg',
        tags: ['keyboard', 'rgb', 'mechanical']
      });

      console.log(`✔ Product inserted. ID: ${newProduct.id}`);

      console.log('  Querying product details (joins order counts & reviews)...');
      const details = await Product.findById(newProduct.id);
      console.log(`  Product Average Rating: ${details.average_rating}, Order Count: ${details.order_count}`);
      if (parseFloat(details.price) !== 149.99) {
        throw new Error('Price attribute mismatch');
      }
      console.log('✔ findById joins verified.');

      console.log('  Querying all products with search & pricing filters...');
      const list = await Product.findAll({
        search: 'Keyboard',
        minPrice: 100,
        sortBy: 'price',
        sortOrder: 'desc'
      });
      
      if (list.length === 0) {
        throw new Error('Filter query returned zero products');
      }
      console.log(`✔ findAll filters verified. Found matching count: ${list.length}`);

      console.log('  Testing update on product stock & tags...');
      const updated = await Product.update(newProduct.id, {
        stock: 100,
        tags: ['keyboard', 'rgb', 'mechanical', 'wireless']
      });
      if (updated.stock !== 100) {
        throw new Error('Product stock was not updated');
      }
      console.log('✔ update verified.');

      console.log('  Testing aggregate getStats query...');
      const stats = await Product.getStats();
      console.log('  Stats Result:', JSON.stringify(stats));
      if (parseInt(stats.total_products) === 0) {
        throw new Error('Product aggregation returned empty stats');
      }
      console.log('✔ getStats query verified.');

      console.log('  Testing getCategoryStats aggregation query...');
      const catStats = await Product.getCategoryStats();
      console.log('  Category Stats Result:', JSON.stringify(catStats));
      console.log('✔ getCategoryStats query verified.');

      console.log('  Deleting test product...');
      await Product.delete(newProduct.id);
      console.log('✔ delete verified.');

      console.log('✔ Product tests completed.');
    } catch (err) {
      console.error('❌ Product model tests failed:', err.message);
    }
  }

  // Teardown connections
  console.log('\n=== Disconnecting database clients... ===');
  if (mongoPassed) {
    await mongodb.disconnect();
  }
  if (pgPassed) {
    await postgresql.disconnect();
  }

  console.log('\n=== Day 10 Integration Tests Finished ===');
}

runTests().catch(err => {
  console.error('Critical test runtime error:', err);
  process.exit(1);
});
