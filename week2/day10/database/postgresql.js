'use strict';

const { Pool } = require('pg');

/**
 * PostgreSQL Connection Factory
 * Configures and manages connection pool status using closures instead of classes.
 */
function createPostgreSQLConnection() {
  let pool = null;
  let isConnected = false;

  const connect = async () => {
    try {
      pool = new Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'sda_training',
        password: process.env.POSTGRES_PASSWORD || 'password',
        port: process.env.POSTGRES_PORT || 5432,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Assert connection by checking out a client and running a simple query
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      isConnected = true;
      console.log('[PostgreSQL] Connected successfully');

      // Hook error handler on the pool instance
      pool.on('error', (err) => {
        console.error('[PostgreSQL] Connection pool error:', err);
        isConnected = false;
      });

    } catch (error) {
      console.error('[PostgreSQL] Connection failed:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (pool) {
      await pool.end();
      isConnected = false;
      console.log('[PostgreSQL] Connection pool closed');
    }
  };

  const query = async (text, params) => {
    if (!pool) {
      throw new Error('[PostgreSQL] Connection pool is not initialized. Call connect() first.');
    }
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      // Optional logging for query timings if needed
      return result;
    } catch (error) {
      console.error('[PostgreSQL] Query execution failed:', { text, error: error.message });
      throw error;
    }
  };

  const getClient = async () => {
    if (!pool) {
      throw new Error('[PostgreSQL] Connection pool is not initialized. Call connect() first.');
    }
    return await pool.connect();
  };

  const getConnectionStatus = () => {
    return {
      isConnected,
      totalCount: pool ? pool.totalCount : 0,
      idleCount: pool ? pool.idleCount : 0,
      waitingCount: pool ? pool.waitingCount : 0
    };
  };

  return {
    connect,
    disconnect,
    query,
    getClient,
    getConnectionStatus
  };
}

module.exports = createPostgreSQLConnection();
