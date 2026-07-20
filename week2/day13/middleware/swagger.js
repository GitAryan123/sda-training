'use strict';

const swaggerUi = require('swagger-ui-express');
const specs = require('../docs/openapi');

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: '/api/v1/docs/swagger.json',
        name: 'SDA Training Auth API'
      }
    ]
  }
};

const setupSwagger = (app) => {
  // Expose the raw JSON specification
  app.get('/api/v1/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Expose the interactive Swagger UI
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

  // Redirect from /api/v1/docs to /api/v1/docs/ to load CSS/JS correctly
  app.get('/api/v1/docs', (req, res) => {
    res.redirect('/api/v1/docs/');
  });
};

module.exports = { setupSwagger };
