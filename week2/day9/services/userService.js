'use strict';

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

/**
 * User Service Factory
 * Returns a configured, stateful user service singleton using closures.
 */
function createUserService() {
  const emitter = new EventEmitter();
  const users = new Map();
  const sessions = new Map();

  const jwtSecret = process.env.JWT_SECRET || 'day9-dev-secret-key';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const saltRounds = 12;

  // Set up service-level event listeners
  emitter.on('user:created', (user) => {
    console.log(`[Event] User created: ${user.email} (ID: ${user.id})`);
  });

  emitter.on('user:updated', (user) => {
    console.log(`[Event] User updated: ${user.email}`);
  });

  emitter.on('user:deleted', (userId) => {
    console.log(`[Event] User deleted: ${userId}`);
  });

  // Seed initial Admin user
  const seedAdmin = async () => {
    const adminEmail = 'admin@apex.dev';
    const hashedPassword = await bcrypt.hash('admin1234', saltRounds);
    const adminUser = {
      id: uuidv4(),
      email: adminEmail,
      password: hashedPassword,
      name: 'Apex Admin',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.set(adminEmail, adminUser);
    console.log(`[UserService] Default Admin seeded (${adminEmail})`);
  };

  // Run initial seeding
  seedAdmin().catch(err => console.error('Admin seeding failed:', err));

  // Helper: sanitize user object for response
  const sanitizeUser = (user) => {
    const { password, ...safeUser } = user;
    return safeUser;
  };

  const createUser = async (userData) => {
    const { email, password, name, role = 'user' } = userData;

    if (!email || !password || !name) {
      throw new AppError('Missing required fields (name, email, password)', 400);
    }

    if (users.has(email)) {
      throw new AppError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.set(email, user);
    emitter.emit('user:created', sanitizeUser(user));

    return sanitizeUser(user);
  };

  const authenticateUser = async (email, password) => {
    const user = users.get(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 403);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    sessions.set(user.id, {
      token,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    return {
      token,
      user: sanitizeUser(user)
    };
  };

  const getUserById = async (userId) => {
    const userObj = Array.from(users.values()).find(u => u.id === userId);
    if (!userObj) {
      throw new AppError('User not found', 404);
    }
    return sanitizeUser(userObj);
  };

  const updateUser = async (userId, updateData) => {
    const userObj = Array.from(users.values()).find(u => u.id === userId);
    if (!userObj) {
      throw new AppError('User not found', 404);
    }

    // Exclude fields that should not be updated directly
    const { password, id, email, createdAt, ...allowedUpdates } = updateData;

    Object.assign(userObj, allowedUpdates, { updatedAt: new Date() });
    users.set(userObj.email, userObj);

    emitter.emit('user:updated', sanitizeUser(userObj));
    return sanitizeUser(userObj);
  };

  const deleteUser = async (userId) => {
    const userObj = Array.from(users.values()).find(u => u.id === userId);
    if (!userObj) {
      throw new AppError('User not found', 404);
    }

    users.delete(userObj.email);
    sessions.delete(userId);

    emitter.emit('user:deleted', userId);
    return { message: 'User deleted successfully' };
  };

  const getAllUsers = async (filters = {}, options = {}) => {
    let usersList = Array.from(users.values());

    // Apply role and activity filters
    if (filters.role) {
      usersList = usersList.filter(u => u.role === filters.role);
    }
    if (filters.isActive !== undefined) {
      const activeBool = filters.isActive === 'true' || filters.isActive === true;
      usersList = usersList.filter(u => u.isActive === activeBool);
    }

    // Apply pagination
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    const total = usersList.length;
    const paginatedUsers = usersList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit)
      .map(u => sanitizeUser(u));

    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  };

  const validateToken = async (token) => {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const session = sessions.get(decoded.userId);

      if (!session || session.token !== token) {
        throw new AppError('Invalid token or session expired', 401);
      }

      session.lastActivity = new Date();
      return decoded;
    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  };

  const logout = async (userId) => {
    sessions.delete(userId);
    return { message: 'Logged out successfully' };
  };

  return {
    on: emitter.on.bind(emitter),
    createUser,
    authenticateUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    validateToken,
    logout
  };
}

module.exports = createUserService();
