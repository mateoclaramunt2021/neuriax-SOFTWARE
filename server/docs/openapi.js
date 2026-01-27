/**
 * OpenAPI/Swagger Documentation
 * API REST - NEURIAX Platform
 */

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'NEURIAX Salon Manager API',
    version: '2.5.0',
    description: 'API REST completa para gestión integral de salones de belleza',
    contact: {
      name: 'NEURIAX Support',
      email: 'support@neuriax.com',
      url: 'https://neuriax.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development Server'
    },
    {
      url: 'https://api.neuriax.com',
      description: 'Production Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          rol: { type: 'string', enum: ['user', 'admin', 'empresa'] },
          activo: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['identificador', 'password'],
        properties: {
          identificador: { type: 'string', description: 'Email o username' },
          password: { type: 'string', format: 'password' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string' },
          usuario: { $ref: '#/components/schemas/User' }
        }
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          clientId: { type: 'integer' },
          serviceId: { type: 'integer' },
          fecha: { type: 'string', format: 'date' },
          hora: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          duracion: { type: 'integer', description: 'Minutos' },
          estado: { type: 'string', enum: ['confirmada', 'cancelada', 'completada'] }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login de usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          401: {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Registrar nuevo usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'username'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  username: { type: 'string', minLength: 3 },
                  nombre_completo: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Usuario creado exitosamente' },
          400: { description: 'Datos inválidos' },
          409: { description: 'Usuario ya existe' }
        }
      }
    },
    '/api/citas': {
      get: {
        tags: ['Appointments'],
        summary: 'Listar citas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de citas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' }
                }
              }
            }
          },
          401: { description: 'No autorizado' }
        }
      },
      post: {
        tags: ['Appointments'],
        summary: 'Crear nueva cita',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Appointment' }
            }
          }
        },
        responses: {
          201: { description: 'Cita creada' },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autorizado' }
        }
      }
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Server is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
