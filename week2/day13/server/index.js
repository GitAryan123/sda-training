'use strict';

const dotenv = require('dotenv');
dotenv.config();

const createExpressApp = require('./app');
const mongodb = require('../database/mongodb');

const port = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Connect MongoDB database client
    await mongodb.connect();

    const app = createExpressApp();
    app.listen(port, () => {
      console.log(`[Auth Server] Initialized successfully on port ${port}`);
    });
  } catch (error) {
    console.error('[Auth Server] Bootstrapping failed:', error);
    process.exit(1);
  }
}

bootstrap();
