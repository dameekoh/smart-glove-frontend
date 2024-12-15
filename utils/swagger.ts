import { OpenAPIV3 } from 'openapi-types';

export function createSwaggerSpec(): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Smart Glove API',
      version: '1.0.0',
      description: 'API documentation for Smart Glove project',
    },
    servers: [
      {
        url: 'https://smart-glove.vercel.app',
        description: 'Production server',
      },
    ],
    paths: {
      '/api/receive-data': {
        post: {
          summary: 'Receive sensor data from Arduino',
          description: 'Endpoint to receive boolean array data from sensors',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'boolean',
                  },
                  example: [true, false, true],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Data received successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'Data received successfully!',
                      },
                      trueCount: {
                        type: 'number',
                        example: 2,
                      },
                      receivedData: {
                        type: 'array',
                        items: {
                          type: 'boolean',
                        },
                        example: [true, false, true],
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid data format',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: false,
                      },
                      message: {
                        type: 'string',
                        example:
                          'Invalid data format. Expected an array of booleans.',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
