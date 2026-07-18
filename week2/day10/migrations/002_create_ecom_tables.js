'use strict';

const postgresql = require('../database/postgresql');

/**
 * Migration Up
 * Sets up relational database schema for ecommerce tables.
 */
async function up() {
  const query = `
    -- Enable pgcrypto extension for gen_random_uuid() if not enabled
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Create Products Table
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      category VARCHAR(50) NOT NULL,
      stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
      image_url VARCHAR(500),
      tags JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

    -- Create Orders Table
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id VARCHAR(50) NOT NULL, -- Flexible support for MongoDB userId strings
      shipping_address JSONB NOT NULL,
      total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

    -- Create Order Items Table
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      quantity INT NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

    -- Create Reviews Table
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id VARCHAR(50) NOT NULL, -- Supports MongoDB userId strings
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
  `;

  await postgresql.query(query);
  console.log('[PostgreSQL Migration] E-Commerce tables created successfully');
}

/**
 * Migration Down
 * Teardown tables in reverse dependency order.
 */
async function down() {
  const query = `
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
  `;
  await postgresql.query(query);
  console.log('[PostgreSQL Migration] E-Commerce tables dropped successfully');
}

module.exports = { up, down };
