'use strict';

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const { AppError, logger } = require('../middleware/errorHandler');

class ProductService extends EventEmitter {
  constructor() {
    super();
    this.products = new Map();
  }

  async initialize() {
    this.on('product:created', (product) => logger.info('Product created', { productId: product.id }));
    this.on('product:updated', (product) => logger.info('Product updated', { productId: product.id }));
    this.on('product:deleted', (productId) => logger.info('Product deleted', { productId }));

    this.seedDefaults();
    logger.info('ProductService initialized', { productCount: this.products.size });
  }

  seedDefaults() {
    if (this.products.size > 0) return;

    const defaults = [
      { name: 'Starter Plan', price: 29.99, stock: 100 },
      { name: 'Pro Plan', price: 79.99, stock: 60 },
      { name: 'Enterprise Plan', price: 199.99, stock: 20 }
    ];

    defaults.forEach((item) => {
      const id = uuidv4();
      this.products.set(id, {
        id,
        name: item.name,
        price: item.price,
        stock: item.stock,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  async createProduct({ name, price, stock = 0 }) {
    if (!name || typeof price !== 'number') {
      throw new AppError('name and numeric price are required', 400, 'VALIDATION_ERROR');
    }

    const product = {
      id: uuidv4(),
      name,
      price,
      stock,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.products.set(product.id, product);
    this.emit('product:created', product);

    return product;
  }

  async getAllProducts() {
    return Array.from(this.products.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductById(productId) {
    const product = this.products.get(productId);
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    return product;
  }

  async updateProduct(productId, updates = {}) {
    const product = await this.getProductById(productId);
    Object.assign(product, updates, { updatedAt: new Date() });
    this.products.set(productId, product);
    this.emit('product:updated', product);
    return product;
  }

  async deleteProduct(productId) {
    const exists = this.products.has(productId);
    if (!exists) throw new AppError('Product not found', 404, 'NOT_FOUND');

    this.products.delete(productId);
    this.emit('product:deleted', productId);
    return { message: 'Product deleted successfully' };
  }
}

module.exports = new ProductService();
