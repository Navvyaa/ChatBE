import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chat Backend API',
            version: '1.0.0',
            description: 'Real-time chat application backend with REST API and WebSocket support',
            contact: {
                name: 'API Support',
                email: 'support@chatapp.com'
            }
        },
        servers: [
            {
                 url: process.env.API_URL || 'http://localhost:5000',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        username: { type: 'string', example: 'john_doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        status: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'AWAY'], example: 'ONLINE' },
                        lastSeen: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Conversation: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        participants: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/User' }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        conversation: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        sender: { $ref: '#/components/schemas/User' },
                        receiver: { $ref: '#/components/schemas/User' },
                        content: { type: 'string', example: 'Hello, how are you?' },
                        delivered: { type: 'boolean', example: false },
                        deliveredAt: { type: 'string', format: 'date-time', nullable: true },
                        read: { type: 'boolean', example: false },
                        readAt: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Error message' }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 },
                        total: { type: 'number', example: 100 },
                        totalPages: { type: 'number', example: 5 },
                        hasMore: { type: 'boolean', example: true }
                    }
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.ts', './src/controller/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
