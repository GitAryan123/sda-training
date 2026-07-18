'use strict';

/**
 * UserService — handles authentication, session tracking, and user CRUD.
 * Extends EventEmitter so other services can react to user lifecycle events.
 *
 * Storage: in-memory Map (keyed by email for O(1) lookups).
 * Swap for MongoDB/Redis in Day 9 without changing the public API.
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, logger } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'day8-dev-secret-changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

class UserService extends EventEmitter {
  constructor() {
    super();
    // Primary store: email → user record
    this.users = new Map();
    // Session store: userId → { token, lastActivity }
    this.sessions = new Map();
  }

  async initialize() {
    this.setupEventHandlers();
    // Seed one admin user for demo purposes
    await this._seedAdmin();
    logger.info('UserService initialized', { userCount: this.users.size });
  }

  setupEventHandlers() {
    this.on('user:created', ({ email, role }) => logger.info(`User created: ${email}`, { role }));
    this.on('user:updated', ({ email }) => logger.info(`User updated: ${email}`));
    this.on('user:deleted', ({ userId }) => logger.info(`User deleted: ${userId}`));
    this.on('user:loggedIn', ({ email }) => logger.info(`User logged in: ${email}`));
    this.on('user:loggedOut', ({ userId }) => logger.info(`User logged out: ${userId}`));
  }

  async _seedAdmin() {
    if (!this.users.has('admin@apex.dev')) {
      await this.createUser({
        name: 'Admin',
        email: 'admin@apex.dev',
        password: 'admin1234',
        role: 'admin'
      });
    }
  }

  async createUser({ name, email, password, role = 'user' }) {
    if (!name || !email || !password) {
      throw new AppError('name, email, and password are required', 400, 'VALIDATION_ERROR');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    if (this.users.has(email)) {
      throw new AppError('A user with this email already exists', 409, 'CONFLICT');
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(email, user);
    this.emit('user:created', { email, role });

    // Return public profile — never include the password hash
    return this._safeUser(user);
  }

  async authenticateUser(email, password) {
    const user = this.users.get(email);

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 403, 'FORBIDDEN');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Overwrite any existing session for this user
    this.sessions.set(user.id, { token, createdAt: new Date(), lastActivity: new Date() });
    this.emit('user:loggedIn', { email });

    return { token, user: this._safeUser(user) };
  }

  async validateToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Re-throw as AppError so errorHandler can classify it properly
      throw err;
    }

    const session = this.sessions.get(decoded.userId);
    if (!session || session.token !== token) {
      throw new AppError('Session has been revoked', 401, 'SESSION_REVOKED');
    }

    session.lastActivity = new Date();
    return decoded;
  }

  async getUserById(userId) {
    const user = this._findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return this._safeUser(user);
  }

  async updateUser(userId, updates) {
    const user = this._findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    // Prevent password updates through this method — use changePassword()
    delete updates.password;
    delete updates.id;
    delete updates.createdAt;

    Object.assign(user, updates, { updatedAt: new Date() });
    this.users.set(user.email, user);
    this.emit('user:updated', { email: user.email });

    return this._safeUser(user);
  }

  async deleteUser(userId) {
    const user = this._findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    this.users.delete(user.email);
    this.sessions.delete(userId);
    this.emit('user:deleted', { userId });

    return { message: 'User deleted successfully' };
  }

  async getAllUsers({ page = 1, limit = 10, role, isActive } = {}) {
    let users = Array.from(this.users.values());

    if (role) users = users.filter(u => u.role === role);
    if (isActive !== undefined) users = users.filter(u => u.isActive === isActive);

    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = users.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const items = users.slice(skip, skip + parseInt(limit)).map(u => this._safeUser(u));

    return {
      users: items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    };
  }

  async logout(userId) {
    this.sessions.delete(userId);
    this.emit('user:loggedOut', { userId });
    return { message: 'Logged out successfully' };
  }

  // ---------- private helpers ----------

  _findById(userId) {
    for (const user of this.users.values()) {
      if (user.id === userId) return user;
    }
    return null;
  }

  _safeUser(user) {
    const { password, ...safe } = user; // eslint-disable-line no-unused-vars
    return safe;
  }
}

module.exports = new UserService();