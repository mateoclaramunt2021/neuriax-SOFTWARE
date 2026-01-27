/**
 * PASO 52: API REST Documentada con Swagger/OpenAPI 3.0
 * Documentación completa de todos los endpoints del NEURIAX Platform
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NEURIAX Platform - API REST',
    version: '2.0.0',
    description: `
# 💈 Sistema de Gestión para Peluquería y Estética

API REST completa para el NEURIAX Platform, una solución integral para la gestión de peluquerías y centros de estética.

## Características principales:
- 🔐 **Autenticación JWT** - Seguridad basada en tokens
- 👥 **Gestión de Clientes** - Base de datos completa
- ✂️ **Servicios** - Catálogo de servicios y precios
- 📅 **Citas** - Sistema de agenda y reservas
- 💰 **Punto de Venta** - Cobros y ventas
- 📦 **Inventario** - Control de stock
- 👨‍💼 **Empleados** - Gestión del equipo
- 💵 **Caja** - Movimientos y arqueos
- 📊 **Reportes** - Estadísticas y análisis
- 📈 **Analytics** - Business Intelligence
- 🧾 **Facturación** - Facturas electrónicas
- 📚 **Contabilidad** - Conexión contable
- 💾 **Backups** - Sistema de respaldos

## Autenticación
La API usa **JWT (JSON Web Tokens)**. Para acceder a los endpoints protegidos:
1. Obtén un token con \`POST /api/auth/login\`
2. Incluye el token en el header: \`Authorization: Bearer <token>\`

## Rate Limiting
- 100 peticiones por minuto por IP
- Headers de respuesta incluyen límites restantes
    `,
    contact: {
      name: 'Soporte Técnico',
      email: 'soporte@NEURIAX.com',
      url: 'https://NEURIAX.com'
    },
    license: {
      name: 'Propietario',
      url: 'https://NEURIAX.com/licencia'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Servidor de Desarrollo'
    },
    {
      url: 'https://api.NEURIAX.com',
      description: 'Servidor de Producción'
    }
  ],
  tags: [
    { name: 'Autenticación', description: 'Endpoints de autenticación y sesión' },
    { name: 'Dashboard', description: 'Estadísticas generales del sistema' },
    { name: 'Clientes', description: 'Gestión de clientes' },
    { name: 'Servicios', description: 'Catálogo de servicios' },
    { name: 'Citas', description: 'Sistema de agenda y reservas' },
    { name: 'Ventas', description: 'Punto de venta y transacciones' },
    { name: 'Inventario', description: 'Control de productos y stock' },
    { name: 'Empleados', description: 'Gestión del equipo' },
    { name: 'Caja', description: 'Movimientos de caja y arqueos' },
    { name: 'Reportes', description: 'Estadísticas y análisis' },
    { name: 'Analytics', description: 'Business Intelligence avanzado' },
    { name: 'Facturación', description: 'Facturas electrónicas' },
    { name: 'Contabilidad', description: 'Conexión contable y asientos' },
    { name: 'Backup', description: 'Sistema de respaldos' },
    { name: 'Notificaciones', description: 'Sistema de notificaciones' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del endpoint de login'
      }
    },
    schemas: {
      // Esquemas de respuesta común
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operación exitosa' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error en la operación' },
          error: { type: 'string' }
        }
      },
      
      // Autenticación
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Sesión iniciada correctamente' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          usuario: { $ref: '#/components/schemas/Usuario' }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'admin' },
          nombre_completo: { type: 'string', example: 'Administrador' },
          rol: { type: 'string', enum: ['administrador', 'empleado', 'recepcionista'], example: 'administrador' }
        }
      },
      
      // Cliente
      Cliente: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'María García' },
          telefono: { type: 'string', example: '612345678' },
          email: { type: 'string', format: 'email', example: 'maria@email.com' },
          notas: { type: 'string', example: 'Prefiere tinte natural' },
          fecha_registro: { type: 'string', format: 'date-time' },
          ultima_visita: { type: 'string', format: 'date-time' },
          total_gastado: { type: 'number', example: 250.50 },
          visitas: { type: 'integer', example: 5 }
        }
      },
      ClienteInput: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', example: 'María García' },
          telefono: { type: 'string', example: '612345678' },
          email: { type: 'string', format: 'email', example: 'maria@email.com' },
          notas: { type: 'string', example: 'Prefiere tinte natural' }
        }
      },
      
      // Servicio
      Servicio: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Corte de pelo' },
          precio: { type: 'number', example: 25.00 },
          duracion: { type: 'integer', example: 30, description: 'Duración en minutos' },
          categoria: { type: 'string', example: 'Cortes' },
          descripcion: { type: 'string', example: 'Corte clásico o moderno' },
          activo: { type: 'boolean', example: true }
        }
      },
      ServicioInput: {
        type: 'object',
        required: ['nombre', 'precio'],
        properties: {
          nombre: { type: 'string', example: 'Corte de pelo' },
          precio: { type: 'number', example: 25.00 },
          duracion: { type: 'integer', example: 30 },
          categoria: { type: 'string', example: 'Cortes' },
          descripcion: { type: 'string' }
        }
      },
      
      // Cita
      Cita: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cita_1234567890' },
          cliente_id: { type: 'integer', example: 1 },
          cliente_nombre: { type: 'string', example: 'María García' },
          empleado_id: { type: 'integer', example: 1 },
          empleado_nombre: { type: 'string', example: 'Ana López' },
          servicio_id: { type: 'integer', example: 1 },
          servicio_nombre: { type: 'string', example: 'Corte de pelo' },
          fecha: { type: 'string', format: 'date', example: '2026-01-25' },
          hora: { type: 'string', example: '10:00' },
          duracion: { type: 'integer', example: 30 },
          estado: { type: 'string', enum: ['pendiente', 'confirmada', 'completada', 'cancelada'], example: 'pendiente' },
          notas: { type: 'string' }
        }
      },
      CitaInput: {
        type: 'object',
        required: ['cliente_id', 'servicio_id', 'fecha', 'hora'],
        properties: {
          cliente_id: { type: 'integer', example: 1 },
          empleado_id: { type: 'integer', example: 1 },
          servicio_id: { type: 'integer', example: 1 },
          fecha: { type: 'string', format: 'date', example: '2026-01-25' },
          hora: { type: 'string', example: '10:00' },
          notas: { type: 'string' }
        }
      },
      
      // Venta
      Venta: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'venta_1234567890' },
          cliente_id: { type: 'integer' },
          cliente_nombre: { type: 'string', example: 'María García' },
          empleado_id: { type: 'integer' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tipo: { type: 'string', enum: ['servicio', 'producto'] },
                id: { type: 'integer' },
                nombre: { type: 'string' },
                cantidad: { type: 'integer' },
                precio_unitario: { type: 'number' },
                subtotal: { type: 'number' }
              }
            }
          },
          subtotal: { type: 'number', example: 50.00 },
          descuento: { type: 'number', example: 5.00 },
          iva: { type: 'number', example: 9.45 },
          total: { type: 'number', example: 54.45 },
          metodo_pago: { type: 'string', enum: ['efectivo', 'tarjeta', 'bizum', 'transferencia'] },
          fecha: { type: 'string', format: 'date-time' }
        }
      },
      VentaInput: {
        type: 'object',
        required: ['items', 'metodo_pago'],
        properties: {
          cliente_id: { type: 'integer' },
          empleado_id: { type: 'integer' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['tipo', 'id', 'cantidad'],
              properties: {
                tipo: { type: 'string', enum: ['servicio', 'producto'] },
                id: { type: 'integer' },
                cantidad: { type: 'integer', default: 1 }
              }
            }
          },
          descuento: { type: 'number', default: 0 },
          metodo_pago: { type: 'string', enum: ['efectivo', 'tarjeta', 'bizum', 'transferencia'] }
        }
      },
      
      // Producto/Inventario
      Producto: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Champú profesional' },
          categoria: { type: 'string', example: 'Cuidado capilar' },
          precio_compra: { type: 'number', example: 8.50 },
          precio_venta: { type: 'number', example: 15.00 },
          stock: { type: 'integer', example: 25 },
          stock_minimo: { type: 'integer', example: 5 },
          proveedor: { type: 'string', example: 'Distribuidora Pro' },
          codigo_barras: { type: 'string', example: '8412345678901' }
        }
      },
      
      // Empleado
      Empleado: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Ana López' },
          telefono: { type: 'string', example: '622334455' },
          email: { type: 'string', format: 'email' },
          rol: { type: 'string', enum: ['estilista', 'esteticista', 'recepcionista', 'gerente'] },
          especialidades: { type: 'array', items: { type: 'string' } },
          activo: { type: 'boolean', example: true },
          fecha_contratacion: { type: 'string', format: 'date' }
        }
      },
      
      // Movimiento de caja
      MovimientoCaja: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tipo: { type: 'string', enum: ['ingreso', 'egreso'] },
          concepto: { type: 'string', example: 'Venta de servicios' },
          monto: { type: 'number', example: 50.00 },
          metodo_pago: { type: 'string' },
          fecha: { type: 'string', format: 'date-time' },
          usuario: { type: 'string' }
        }
      },
      
      // Factura
      Factura: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'fact_1234567890' },
          numero: { type: 'string', example: 'F2026-000001' },
          serie: { type: 'string', example: 'F' },
          fecha_emision: { type: 'string', format: 'date-time' },
          cliente: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              nif: { type: 'string' },
              direccion: { type: 'string' }
            }
          },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                concepto: { type: 'string' },
                cantidad: { type: 'number' },
                precio_unitario: { type: 'number' },
                iva: { type: 'number' },
                subtotal: { type: 'number' }
              }
            }
          },
          base_imponible: { type: 'number' },
          total_iva: { type: 'number' },
          total: { type: 'number' },
          estado: { type: 'string', enum: ['borrador', 'emitida', 'pagada', 'anulada'] }
        }
      },
      
      // Asiento contable
      AsientoContable: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          numero: { type: 'string', example: '2026-000001' },
          fecha: { type: 'string', format: 'date-time' },
          concepto: { type: 'string', example: 'Venta servicios' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                cuenta: { type: 'string', example: '572' },
                descripcion: { type: 'string' },
                debe: { type: 'number' },
                haber: { type: 'number' }
              }
            }
          },
          totalDebe: { type: 'number' },
          totalHaber: { type: 'number' },
          tipo: { type: 'string', enum: ['venta', 'compra', 'nomina', 'manual', 'arqueo'] }
        }
      },
      
      // Backup
      Backup: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fecha: { type: 'string', format: 'date-time' },
          tipo: { type: 'string', enum: ['completo', 'incremental', 'manual'] },
          tamaño: { type: 'string', example: '2.5 MB' },
          ruta: { type: 'string' },
          estado: { type: 'string', enum: ['completado', 'error', 'en_progreso'] }
        }
      },
      
      // Dashboard stats
      DashboardStats: {
        type: 'object',
        properties: {
          ventasHoy: { type: 'number', example: 450.00 },
          citasHoy: { type: 'integer', example: 8 },
          clientesNuevos: { type: 'integer', example: 3 },
          productosStockBajo: { type: 'integer', example: 2 },
          ingresosMes: { type: 'number', example: 8500.00 },
          citasPendientes: { type: 'integer', example: 15 }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Token no proporcionado o inválido',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Token no proporcionado' }
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Recurso no encontrado' }
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Error de validación',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Datos inválidos' },
                errors: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    // ==================== AUTENTICACIÓN ====================
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: 'Autentica un usuario y devuelve un token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '401': {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar sesión',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Sesión cerrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/verify': {
      get: {
        tags: ['Autenticación'],
        summary: 'Verificar token',
        description: 'Verifica si el token actual es válido',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Token válido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    usuario: { $ref: '#/components/schemas/Usuario' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' }
        }
      }
    },
    
    // ==================== DASHBOARD ====================
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Obtener estadísticas del dashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Estadísticas del sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/DashboardStats' }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    // ==================== CLIENTES ====================
    '/api/clientes': {
      get: {
        tags: ['Clientes'],
        summary: 'Listar todos los clientes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'buscar', in: 'query', schema: { type: 'string' }, description: 'Buscar por nombre o teléfono' },
          { name: 'limite', in: 'query', schema: { type: 'integer' }, description: 'Límite de resultados' }
        ],
        responses: {
          '200': {
            description: 'Lista de clientes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Cliente' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Clientes'],
        summary: 'Crear nuevo cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClienteInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Cliente creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Cliente' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/api/clientes/{id}': {
      get: {
        tags: ['Clientes'],
        summary: 'Obtener cliente por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'Datos del cliente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Cliente' }
                  }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      },
      put: {
        tags: ['Clientes'],
        summary: 'Actualizar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClienteInput' }
            }
          }
        },
        responses: {
          '200': { description: 'Cliente actualizado' },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      },
      delete: {
        tags: ['Clientes'],
        summary: 'Eliminar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Cliente eliminado' },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      }
    },
    
    // ==================== SERVICIOS ====================
    '/api/servicios': {
      get: {
        tags: ['Servicios'],
        summary: 'Listar todos los servicios',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de servicios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Servicio' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Servicios'],
        summary: 'Crear nuevo servicio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ServicioInput' }
            }
          }
        },
        responses: {
          '201': { description: 'Servicio creado' },
          '400': { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/api/servicios/{id}': {
      put: {
        tags: ['Servicios'],
        summary: 'Actualizar servicio',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ServicioInput' }
            }
          }
        },
        responses: {
          '200': { description: 'Servicio actualizado' }
        }
      },
      delete: {
        tags: ['Servicios'],
        summary: 'Eliminar servicio',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Servicio eliminado' }
        }
      }
    },
    
    // ==================== CITAS ====================
    '/api/citas': {
      get: {
        tags: ['Citas'],
        summary: 'Listar citas',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fecha', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filtrar por fecha' },
          { name: 'estado', in: 'query', schema: { type: 'string' }, description: 'Filtrar por estado' },
          { name: 'empleado_id', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por empleado' }
        ],
        responses: {
          '200': {
            description: 'Lista de citas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Cita' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Citas'],
        summary: 'Crear nueva cita',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CitaInput' }
            }
          }
        },
        responses: {
          '201': { description: 'Cita creada' }
        }
      }
    },
    '/api/citas/{id}': {
      put: {
        tags: ['Citas'],
        summary: 'Actualizar cita',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Cita actualizada' }
        }
      },
      delete: {
        tags: ['Citas'],
        summary: 'Cancelar cita',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Cita cancelada' }
        }
      }
    },
    '/api/citas/{id}/confirmar': {
      put: {
        tags: ['Citas'],
        summary: 'Confirmar cita',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Cita confirmada' }
        }
      }
    },
    '/api/citas/{id}/completar': {
      put: {
        tags: ['Citas'],
        summary: 'Marcar cita como completada',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Cita completada' }
        }
      }
    },
    
    // ==================== VENTAS ====================
    '/api/ventas': {
      get: {
        tags: ['Ventas'],
        summary: 'Listar ventas',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fecha_desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fecha_hasta', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': {
            description: 'Lista de ventas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Venta' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Ventas'],
        summary: 'Crear nueva venta',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VentaInput' }
            }
          }
        },
        responses: {
          '201': { description: 'Venta registrada' }
        }
      }
    },
    
    // ==================== INVENTARIO ====================
    '/api/inventario': {
      get: {
        tags: ['Inventario'],
        summary: 'Listar productos del inventario',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de productos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Producto' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Inventario'],
        summary: 'Agregar producto al inventario',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Producto agregado' }
        }
      }
    },
    '/api/inventario/stock-bajo': {
      get: {
        tags: ['Inventario'],
        summary: 'Productos con stock bajo',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de productos con stock bajo' }
        }
      }
    },
    
    // ==================== EMPLEADOS ====================
    '/api/empleados': {
      get: {
        tags: ['Empleados'],
        summary: 'Listar empleados',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de empleados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Empleado' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Empleados'],
        summary: 'Agregar empleado',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Empleado agregado' }
        }
      }
    },
    
    // ==================== CAJA ====================
    '/api/caja/movimientos': {
      get: {
        tags: ['Caja'],
        summary: 'Listar movimientos de caja',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fecha', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': {
            description: 'Lista de movimientos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/MovimientoCaja' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Caja'],
        summary: 'Registrar movimiento de caja',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Movimiento registrado' }
        }
      }
    },
    '/api/caja/arqueo': {
      get: {
        tags: ['Caja'],
        summary: 'Obtener arqueo del día',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Datos del arqueo' }
        }
      },
      post: {
        tags: ['Caja'],
        summary: 'Realizar arqueo de caja',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Arqueo realizado' }
        }
      }
    },
    
    // ==================== REPORTES ====================
    '/api/reportes/ventas': {
      get: {
        tags: ['Reportes'],
        summary: 'Reporte de ventas',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'periodo', in: 'query', schema: { type: 'string', enum: ['dia', 'semana', 'mes', 'año'] } },
          { name: 'fecha_desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fecha_hasta', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': { description: 'Reporte de ventas' }
        }
      }
    },
    '/api/reportes/servicios': {
      get: {
        tags: ['Reportes'],
        summary: 'Reporte de servicios más solicitados',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Reporte de servicios' }
        }
      }
    },
    '/api/reportes/clientes': {
      get: {
        tags: ['Reportes'],
        summary: 'Reporte de clientes',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Reporte de clientes' }
        }
      }
    },
    
    // ==================== ANALYTICS ====================
    '/api/analytics/kpis': {
      get: {
        tags: ['Analytics'],
        summary: 'Obtener KPIs del negocio',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'KPIs calculados' }
        }
      }
    },
    '/api/analytics/tendencias': {
      get: {
        tags: ['Analytics'],
        summary: 'Análisis de tendencias',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Datos de tendencias' }
        }
      }
    },
    '/api/analytics/predicciones': {
      get: {
        tags: ['Analytics'],
        summary: 'Predicciones de ventas',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Predicciones' }
        }
      }
    },
    
    // ==================== FACTURACIÓN ====================
    '/api/facturacion/facturas': {
      get: {
        tags: ['Facturación'],
        summary: 'Listar facturas',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de facturas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    facturas: { type: 'array', items: { $ref: '#/components/schemas/Factura' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Facturación'],
        summary: 'Crear factura',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Factura creada' }
        }
      }
    },
    '/api/facturacion/facturas/{id}/exportar/{formato}': {
      get: {
        tags: ['Facturación'],
        summary: 'Exportar factura',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'formato', in: 'path', required: true, schema: { type: 'string', enum: ['pdf', 'xml', 'json'] } }
        ],
        responses: {
          '200': { description: 'Factura exportada' }
        }
      }
    },
    
    // ==================== CONTABILIDAD ====================
    '/api/contabilidad/asientos': {
      get: {
        tags: ['Contabilidad'],
        summary: 'Listar asientos contables',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de asientos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    asientos: { type: 'array', items: { $ref: '#/components/schemas/AsientoContable' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/contabilidad/asiento': {
      post: {
        tags: ['Contabilidad'],
        summary: 'Crear asiento contable',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Asiento creado' }
        }
      }
    },
    '/api/contabilidad/balance-sumas': {
      get: {
        tags: ['Contabilidad'],
        summary: 'Balance de sumas y saldos',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Balance generado' }
        }
      }
    },
    '/api/contabilidad/iva/{trimestre}': {
      get: {
        tags: ['Contabilidad'],
        summary: 'Resumen IVA trimestral',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'trimestre', in: 'path', required: true, schema: { type: 'integer', minimum: 1, maximum: 4 } }
        ],
        responses: {
          '200': { description: 'Resumen IVA' }
        }
      }
    },
    '/api/contabilidad/exportar/{formato}': {
      get: {
        tags: ['Contabilidad'],
        summary: 'Exportar contabilidad',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'formato', in: 'path', required: true, schema: { type: 'string', enum: ['csv', 'json', 'a3', 'sage'] } }
        ],
        responses: {
          '200': { description: 'Datos exportados' }
        }
      }
    },
    
    // ==================== BACKUP ====================
    '/api/backup/crear': {
      post: {
        tags: ['Backup'],
        summary: 'Crear backup manual',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Backup creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    backup: { $ref: '#/components/schemas/Backup' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/backup/lista': {
      get: {
        tags: ['Backup'],
        summary: 'Listar backups disponibles',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de backups' }
        }
      }
    },
    '/api/backup/restaurar/{id}': {
      post: {
        tags: ['Backup'],
        summary: 'Restaurar backup',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Backup restaurado' }
        }
      }
    },
    
    // ==================== NOTIFICACIONES ====================
    '/api/notificaciones': {
      get: {
        tags: ['Notificaciones'],
        summary: 'Obtener notificaciones',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de notificaciones' }
        }
      }
    },
    '/api/notificaciones/enviar': {
      post: {
        tags: ['Notificaciones'],
        summary: 'Enviar notificación',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Notificación enviada' }
        }
      }
    },
    
    // ==================== HEALTH ====================
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del servidor',
        responses: {
          '200': {
            description: 'Servidor operativo',
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

module.exports = swaggerDefinition;
