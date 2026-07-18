'use strict';

const postgresql = require('../database/postgresql');

/**
 * PostgreSQL Product Model Factory
 * Returns an object containing query helper functions using closures instead of classes.
 */
function createProductModel() {
  const create = async (productData) => {
    const { name, description, price, category, stock, imageUrl, tags = [] } = productData;
    
    const query = `
      INSERT INTO products (name, description, price, category, stock, image_url, tags, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      name, 
      description, 
      parseFloat(price), 
      category, 
      parseInt(stock), 
      imageUrl || null, 
      JSON.stringify(tags)
    ];
    
    const result = await postgresql.query(query, values);
    return result.rows[0];
  };

  const findById = async (id) => {
    const query = `
      SELECT p.*, 
             COALESCE(COUNT(DISTINCT oi.order_id), 0) as order_count,
             COALESCE(AVG(r.rating), 0) as average_rating
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await postgresql.query(query, [id]);
    return result.rows[0];
  };

  const findAll = async (filters = {}) => {
    let query = `
      SELECT p.*, 
             COALESCE(COUNT(DISTINCT oi.order_id), 0) as order_count,
             COALESCE(AVG(r.rating), 0) as average_rating
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 0;

    if (filters.category) {
      paramCount++;
      conditions.push(`p.category = $${paramCount}`);
      values.push(filters.category);
    }

    if (filters.minPrice) {
      paramCount++;
      conditions.push(`p.price >= $${paramCount}`);
      values.push(parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      paramCount++;
      conditions.push(`p.price <= $${paramCount}`);
      values.push(parseFloat(filters.maxPrice));
    }

    if (filters.search) {
      paramCount++;
      conditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY p.id`;

    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' || filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
      // Whitelist sorting parameters to prevent SQL injection
      const allowedSortFields = ['created_at', 'updated_at', 'name', 'price', 'stock'];
      const field = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
      query += ` ORDER BY p.${field} ${sortOrder}`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(parseInt(filters.offset));
    }

    const result = await postgresql.query(query, values);
    return result.rows;
  };

  const update = async (id, updateData) => {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      // Exclude read-only columns
      if (['id', 'created_at', 'updated_at'].includes(key)) return;

      if (updateData[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        
        let val = updateData[key];
        if (key === 'price') val = parseFloat(val);
        if (key === 'stock') val = parseInt(val);
        if (key === 'tags') val = JSON.stringify(val);

        values.push(val);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields provided to update');
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE products 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await postgresql.query(query, values);
    return result.rows[0];
  };

  const deleteProduct = async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await postgresql.query(query, [id]);
    return result.rows[0];
  };

  const getStats = async () => {
    const query = `
      SELECT 
        COALESCE(COUNT(*), 0) as total_products,
        COALESCE(AVG(price), 0) as average_price,
        COALESCE(MIN(price), 0) as min_price,
        COALESCE(MAX(price), 0) as max_price,
        COALESCE(SUM(stock), 0) as total_stock
      FROM products
    `;
    
    const result = await postgresql.query(query);
    return result.rows[0];
  };

  const getCategoryStats = async () => {
    const query = `
      SELECT 
        category,
        COALESCE(COUNT(*), 0) as product_count,
        COALESCE(AVG(price), 0) as average_price,
        COALESCE(SUM(stock), 0) as total_stock
      FROM products
      GROUP BY category
      ORDER BY product_count DESC
    `;
    
    const result = await postgresql.query(query);
    return result.rows;
  };

  return {
    create,
    findById,
    findAll,
    update,
    delete: deleteProduct,
    getStats,
    getCategoryStats
  };
}

module.exports = createProductModel();