'use strict';

const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');

/**
 * Product Service Factory
 * Returns a configured product service singleton using closures.
 */
function createProductService() {
  const products = new Map();

  // Seed default products
  const seedProducts = () => {
    const defaultProducts = [
      {
        id: uuidv4(),
        name: 'Apex Mechanical Keyboard',
        description: 'Premium RGB mechanical keyboard with custom linear switches.',
        price: 129.99,
        category: 'Electronics',
        stock: 50
      },
      {
        id: uuidv4(),
        name: 'Apex Wireless Mouse',
        description: 'Ergonomic gaming mouse with optical switches and high DPI sensor.',
        price: 79.99,
        category: 'Electronics',
        stock: 120
      },
      {
        id: uuidv4(),
        name: '4K Ultra-Wide Monitor',
        description: '34-inch curved display optimized for programming and creative workflows.',
        price: 499.99,
        category: 'Electronics',
        stock: 15
      }
    ];

    defaultProducts.forEach(product => {
      const fullProduct = {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      products.set(fullProduct.id, fullProduct);
    });

    console.log(`[ProductService] Seeded ${products.size} default products`);
  };

  // Run seed
  seedProducts();

  const createProduct = async (productData) => {
    const { name, description, price, category, stock = 0 } = productData;

    if (!name || !description || price === undefined || !category) {
      throw new AppError('Missing required fields for product creation', 400);
    }

    const product = {
      id: uuidv4(),
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    products.set(product.id, product);
    return product;
  };

  const getProductById = async (productId) => {
    const product = products.get(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  };

  const updateProduct = async (productId, updateData) => {
    const product = products.get(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const { id, createdAt, ...allowedUpdates } = updateData;

    if (updateData.price !== undefined) allowedUpdates.price = parseFloat(updateData.price);
    if (updateData.stock !== undefined) allowedUpdates.stock = parseInt(updateData.stock);

    Object.assign(product, allowedUpdates, { updatedAt: new Date() });
    products.set(productId, product);
    return product;
  };

  const deleteProduct = async (productId) => {
    if (!products.has(productId)) {
      throw new AppError('Product not found', 404);
    }
    products.delete(productId);
    return { message: 'Product deleted successfully' };
  };

  const getAllProducts = async (filters = {}, options = {}) => {
    let productList = Array.from(products.values());

    // Apply category filter
    if (filters.category) {
      productList = productList.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      productList = productList.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort options
    const sortField = options.sort || 'createdAt';
    const order = options.order === 'asc' ? 1 : -1;

    productList.sort((a, b) => {
      if (typeof a[sortField] === 'string') {
        return a[sortField].localeCompare(b[sortField]) * order;
      }
      return (a[sortField] - b[sortField]) * order;
    });

    // Pagination
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    const total = productList.length;
    const paginatedProducts = productList.slice(skip, skip + limit);

    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  };

  return {
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllProducts
  };
}

module.exports = createProductService();
