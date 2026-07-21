'use strict';

const fs = require('fs');
const path = require('path');
const specs = require('../docs/openapi');

const generatePostmanCollection = (openapiSpecs) => {
  const collection = {
    info: {
      name: 'SDA Training Auth API Collection',
      description: 'Automatically generated Postman collection from OpenAPI documentation',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'base_url',
        value: 'http://localhost:3000/api/v1',
        type: 'string'
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string'
      }
    ],
    item: []
  };

  if (!openapiSpecs.paths) {
    return collection;
  }

  // Group by tags or keep flat
  const paths = Object.keys(openapiSpecs.paths);
  
  paths.forEach((apiPath) => {
    const methods = Object.keys(openapiSpecs.paths[apiPath]);
    
    methods.forEach((method) => {
      const operation = openapiSpecs.paths[apiPath][method];
      
      // Determine headers
      const headers = [];
      
      // Request body parsing
      let bodyData = null;
      if (operation.requestBody && operation.requestBody.content) {
        const jsonContent = operation.requestBody.content['application/json'];
        if (jsonContent && jsonContent.schema) {
          const schema = jsonContent.schema;
          const bodyExample = {};
          
          if (schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
              const prop = schema.properties[key];
              bodyExample[key] = prop.example !== undefined ? prop.example : '';
            });
          }
          
          bodyData = {
            mode: 'raw',
            raw: JSON.stringify(bodyExample, null, 2),
            options: {
              raw: {
                language: 'json'
              }
            }
          };
        }
      }

      // Query parameters
      const queryParams = [];
      if (operation.parameters) {
        operation.parameters.forEach((param) => {
          if (param.in === 'query') {
            queryParams.push({
              key: param.name,
              value: param.schema?.default || '',
              description: param.description || ''
            });
          }
        });
      }

      const item = {
        name: operation.summary || `${method.toUpperCase()} ${apiPath}`,
        request: {
          method: method.toUpperCase(),
          header: headers,
          url: {
            raw: '{{base_url}}' + apiPath,
            host: ['{{base_url}}'],
            path: apiPath.split('/').filter(Boolean),
            query: queryParams.length > 0 ? queryParams : undefined
          },
          description: operation.description || ''
        },
        response: []
      };

      if (bodyData) {
        item.request.body = bodyData;
      }

      // If route doesn't require security, remove bearer auth at request level if desired (or rely on default)
      if (!operation.security) {
        item.request.auth = {
          type: 'noauth'
        };
      }

      collection.item.push(item);
    });
  });

  return collection;
};

// Generate and write
const collectionJson = generatePostmanCollection(specs);
const outputDir = path.join(__dirname, '../docs');
const outputPath = path.join(outputDir, 'postman-collection.json');

// Ensure docs folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(collectionJson, null, 2), 'utf8');

console.log('[Postman Generator] Collection generated successfully!');
console.log(`[Postman Generator] Output saved to: ${outputPath}`);

module.exports = { generatePostmanCollection };
