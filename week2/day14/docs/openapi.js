'use strict';

const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SDA Training Auth API',
      version: '1.0.0',
      description: 'API documentation for the Authentication & RBAC service of the SDA training program',
      contact: {
        name: 'API Support',
        email: 'support@sda-training.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide the JWT Access Token in the Authorization header'
        }
      },
      schemas: {
        UserPreferences: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              enum: ['light', 'dark'],
              default: 'light',
              example: 'dark'
            },
            notifications: {
              type: 'object',
              properties: {
                email: {
                  type: 'boolean',
                  default: true,
                  example: true
                },
                push: {
                  type: 'boolean',
                  default: true,
                  example: false
                }
              }
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            bio: {
              type: 'string',
              maxLength: 500,
              example: 'Software Engineer in training.'
            },
            location: {
              type: 'string',
              maxLength: 100,
              example: 'San Francisco, CA'
            },
            website: {
              type: 'string',
              format: 'uri',
              example: 'https://johndoe.dev'
            }
          }
        },
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique database identifier of the user',
              example: '60c72b2f9b1d8a3424d9c739'
            },
            name: {
              type: 'string',
              maxLength: 50,
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              default: 'user',
              example: 'user'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://example.com/avatars/johndoe.jpg'
            },
            isActive: {
              type: 'boolean',
              default: true,
              example: true
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-07-20T12:00:00.000Z'
            },
            preferences: {
              $ref: '#/components/schemas/UserPreferences'
            },
            profile: {
              $ref: '#/components/schemas/UserProfile'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-07-18T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-07-20T12:00:00.000Z'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '60c72b2f9b1d8a3424d9c739'
                    },
                    name: {
                      type: 'string',
                      example: 'John Doe'
                    },
                    email: {
                      type: 'string',
                      example: 'john.doe@example.com'
                    },
                    role: {
                      type: 'string',
                      example: 'user'
                    }
                  }
                },
                accessToken: {
                  type: 'string',
                  description: 'JWT Access Token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT Refresh Token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            }
          }
        },
        TokenRefreshResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Token refreshed successfully'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            }
          }
        },
        ProfileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Invalid input credentials'
                },
                statusCode: {
                  type: 'integer',
                  example: 400
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')]
};

const specs = swaggerJSDoc(options);

module.exports = specs;
