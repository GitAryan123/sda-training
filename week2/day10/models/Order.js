'use strict';

const postgresql = require('../database/postgresql');

/**
 * PostgreSQL Order Model Factory
 * Returns functions to execute order operations using PG queries.
 */
function createOrderModel() {
  const create = async (orderData) => {
    const { customerId, items, shippingAddress, total } = orderData;

    // Connect a client from the pool to execute a transaction
    const client = await postgresql.getClient();

    try {
      await client.query('BEGIN');

      // 1. Insert order record
      const orderQuery = `
        INSERT INTO orders (customer_id, shipping_address, total, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'pending', NOW(), NOW())
        RETURNING *
      `;
      const orderValues = [customerId, JSON.stringify(shippingAddress), parseFloat(total)];
      const orderRes = await client.query(orderQuery, orderValues);
      const order = orderRes.rows[0];

      // 2. Insert order items
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, price, quantity, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

      const insertedItems = [];
      for (const item of items) {
        const itemValues = [order.id, item.productId, parseFloat(item.price), parseInt(item.quantity)];
        const itemRes = await client.query(itemQuery, itemValues);
        insertedItems.push(itemRes.rows[0]);
      }

      await client.query('COMMIT');
      
      return {
        ...order,
        items: insertedItems
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  };

  const findById = async (id) => {
    // 1. Query order info
    const orderRes = await postgresql.query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = orderRes.rows[0];
    if (!order) return null;

    // 2. Query items and join product names
    const itemsQuery = `
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const itemsRes = await postgresql.query(itemsQuery, [id]);
    
    return {
      ...order,
      items: itemsRes.rows
    };
  };

  const findAll = async (filters = {}, options = {}) => {
    let queryStr = 'SELECT * FROM orders';
    const conditions = [];
    const values = [];
    let paramCount = 0;

    if (filters.customerId) {
      paramCount++;
      conditions.push(`customer_id = $${paramCount}`);
      values.push(filters.customerId);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryStr += ' ORDER BY created_at DESC';

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    paramCount++;
    queryStr += ` LIMIT $${paramCount}`;
    values.push(limit);

    paramCount++;
    queryStr += ` OFFSET $${paramCount}`;
    values.push(skip);

    const result = await postgresql.query(queryStr, values);
    return result.rows;
  };

  const updateStatus = async (id, status) => {
    const query = `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await postgresql.query(query, [status, id]);
    return result.rows[0];
  };

  const getStats = async () => {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as gross_revenue,
        AVG(total) as average_order_value,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_count,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
      FROM orders
    `;
    const result = await postgresql.query(query);
    return result.rows[0];
  };

  return {
    create,
    findById,
    findAll,
    updateStatus,
    getStats
  };
}

module.exports = createOrderModel();
