'use strict';

const mongoose = require('mongoose');

/**
 * MongoDB Connection Factory
 * Configures and manages connection status using closures instead of classes.
 */
function createMongoDBConnection() {
  let isConnected = false;

  const connect = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sda-training';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      isConnected = true;
      console.log('[MongoDB] Connected successfully');

      // Hook lifecycle event handlers
      mongoose.connection.on('error', (error) => {
        console.error('[MongoDB] Connection error:', error);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Reconnected');
        isConnected = true;
      });

    } catch (error) {
      console.error('[MongoDB] Connection failed:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
      console.log('[MongoDB] Disconnected manually');
    }
  };

  const getConnectionStatus = () => {
    return {
      isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  };

  return {
    connect,
    disconnect,
    getConnectionStatus
  };
}

module.exports = createMongoDBConnection();
