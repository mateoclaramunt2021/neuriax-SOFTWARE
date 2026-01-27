/**
 * PASO 8 - Endpoint para crear nuevos tenants (Multi-Tenant SaaS)
 * POST /api/tenants/create
 * Crea: tenant, usuario admin, y subscripción inicial (Free)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase, saveDatabase, loadDatabase } = require('../database/init');

const router = express.Router();

/**
 * POST /create
 * Crear nuevo tenant con usuario administrador y subscripción
 * Body: { tenant_name, admin_email, admin_password, admin_fullname }
 */
router.post('/', async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();

    const { tenant_name, admin_email, admin_password, admin_fullname } = req.body;

    // Validación de datos requeridos
    if (!tenant_name || !admin_email || !admin_password || !admin_fullname) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: tenant_name, admin_email, admin_password, admin_fullname'
      });
    }

    if (admin_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Generar tenant_id
    const tenantId = tenant_name.toLowerCase().replace(/\s+/g, '-');

    // Verificar que el tenant no existe
    const existingTenant = db.tenants && db.tenants.find(t => t.id === tenantId);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: `El tenant '${tenantId}' ya existe`
      });
    }

    // Verificar que el email no existe
    const existingUser = db.platform_users && db.platform_users.find(u => u.email === admin_email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // 1. Crear nuevo tenant
    const newTenant = {
      id: tenantId,
      nombre: tenant_name,
      descripcion: `Tenant ${tenant_name}`,
      logo_url: `https://neuriax.com/logos/${tenantId}.png`,
      sitio_web: `https://${tenantId}.neuriax.com`,
      estado: 'activo',
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    // 2. Crear usuario administrador
    const hashedPassword = bcrypt.hashSync(admin_password, 10);
    const newAdmin = {
      id: (db.platform_users && db.platform_users.length) ? Math.max(...db.platform_users.map(u => u.id)) + 1 : 1,
      tenant_id: tenantId,
      username: admin_email.split('@')[0],
      password: hashedPassword,
      nombre_completo: admin_fullname,
      email: admin_email,
      rol: 'administrador',
      activo: 1,
      permisos: ['full_access'],
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    };

    // 3. Crear subscripción inicial (Basic)
    const newSubscription = {
      id: (db.subscriptions && db.subscriptions.length) ? Math.max(...db.subscriptions.map(s => s.id)) + 1 : 1,
      tenant_id: tenantId,
      plan: 'basic',
      precio_mensual: 39,
      estado: 'activa',
      fecha_inicio: new Date().toISOString(),
      fecha_vencimiento: null,
      limites: {
        usuarios: 2,
        clientes: 100,
        transacciones_mensuales: 500
      },
      caracteristicas: ['basico', 'reportes_simples']
    };

    // Agregar a la base de datos
    if (!db.tenants) db.tenants = [];
    if (!db.platform_users) db.platform_users = [];
    if (!db.subscriptions) db.subscriptions = [];

    db.tenants.push(newTenant);
    db.platform_users.push(newAdmin);
    db.subscriptions.push(newSubscription);

    // Guardar cambios
    saveDatabase();

    // Generar JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'NEURIAX_SaaS_Platform_2026_SecretKey';
    const token = jwt.sign(
      {
        id: newAdmin.id,
        tenant_id: tenantId,
        email: admin_email,
        rol: 'administrador'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Tenant creado exitosamente',
      data: {
        tenant: {
          id: newTenant.id,
          nombre: newTenant.nombre,
          url: newTenant.sitio_web
        },
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          nombre_completo: newAdmin.nombre_completo
        },
        subscription: {
          plan: newSubscription.plan,
          limites: newSubscription.limites
        },
        token,
        credentials: {
          tenant_id: tenantId,
          username: newAdmin.username,
          email: admin_email
        }
      }
    });

  } catch (error) {
    console.error('Error creando tenant:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el tenant',
      error: error.message
    });
  }
});

module.exports = router;
