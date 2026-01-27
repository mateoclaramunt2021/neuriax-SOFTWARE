/**
 * NEURIAX SaaS Platform - Tenants API Routes
 * PASO 2: Rutas para gestión de tenants y suscripciones
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  getTenantById, 
  getTenantBySlug, 
  getTenantByEmail,
  createTenant, 
  updateTenant,
  getAllPlans,
  getPlanById,
  generateUUID,
  loadTenantsDb,
  saveTenantsDb
} = require('../middleware/tenant');

const JWT_SECRET = process.env.JWT_SECRET || 'NEURIAX_SaaS_Platform_2026_SecretKey';

/**
 * GET /api/tenants/plans
 * Obtener todos los planes disponibles
 */
router.get('/plans', (req, res) => {
  try {
    const plans = getAllPlans();
    res.json({
      success: true,
      plans: plans.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio_mensual: p.precio_mensual,
        precio_anual: p.precio_anual,
        destacado: p.destacado,
        descripcion: p.descripcion,
        features: p.features,
        limites: p.limites
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tenants/plans/:planId
 * Obtener detalle de un plan
 */
router.get('/plans/:planId', (req, res) => {
  try {
    const plan = getPlanById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan no encontrado' });
    }
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tenants/register
 * Registrar nuevo tenant (negocio)
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      nombre_negocio, 
      slug, 
      email, 
      password,
      telefono,
      nombre_propietario,
      plan_id = 'basic',
      timezone = 'Europe/Madrid',
      idioma = 'es',
      moneda = 'EUR'
    } = req.body;
    
    // Validaciones
    if (!nombre_negocio || !slug || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere: nombre_negocio, slug, email y password'
      });
    }
    
    // Validar formato de slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Slug inválido',
        message: 'El subdominio solo puede contener letras minúsculas, números y guiones'
      });
    }
    
    // Slugs reservados
    const reservedSlugs = ['www', 'api', 'admin', 'app', 'dashboard', 'login', 'register', 'demo', 'test', 'staging', 'dev'];
    if (reservedSlugs.includes(slug.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Slug reservado',
        message: 'Este subdominio está reservado. Por favor elige otro.'
      });
    }
    
    // Verificar si el slug ya existe
    if (getTenantBySlug(slug.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Slug en uso',
        message: 'Este subdominio ya está en uso. Por favor elige otro.'
      });
    }
    
    // Verificar si el email ya existe
    if (getTenantByEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email en uso',
        message: 'Este email ya está registrado. ¿Olvidaste tu contraseña?'
      });
    }
    
    // Verificar que el plan existe
    const plan = getPlanById(plan_id);
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Plan inválido',
        message: 'El plan seleccionado no existe.'
      });
    }
    
    // Crear el tenant
    const newTenant = createTenant({
      nombre: nombre_negocio,
      slug: slug.toLowerCase(),
      email: email.toLowerCase(),
      telefono,
      plan_id,
      timezone,
      idioma,
      moneda,
      nombre_negocio,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      referral: req.get('Referer'),
      utm_source: req.query.utm_source,
      utm_medium: req.query.utm_medium,
      utm_campaign: req.query.utm_campaign
    });
    
    // Crear usuario administrador para el tenant
    const hashedPassword = bcrypt.hashSync(password, 12);
    const fs = require('fs');
    const path = require('path');
    
    // Crear base de datos específica del tenant
    const tenantDbPath = path.join(__dirname, `../database/tenant_${newTenant.id}.json`);
    const tenantDb = {
      tenant_id: newTenant.id,
      usuarios: [{
        id: 1,
        tenant_id: newTenant.id,
        username: 'admin',
        password: hashedPassword,
        nombre_completo: nombre_propietario || 'Administrador',
        email: email,
        rol: 'administrador',
        activo: 1,
        fecha_creacion: new Date().toISOString(),
        ultimo_acceso: null
      }],
      sesiones: [],
      clientes: [],
      servicios: [],
      ventas: [],
      empleados: [],
      cajas: [],
      gastos: [],
      citas: [],
      productos: [],
      movimientos_inventario: [],
      configuracion: {
        nombre_negocio: nombre_negocio,
        telefono: telefono || '',
        email: email,
        direccion: '',
        color_primario: '#8b5cf6',
        timezone: timezone,
        idioma: idioma,
        moneda: moneda
      }
    };
    
    fs.writeFileSync(tenantDbPath, JSON.stringify(tenantDb, null, 2), 'utf8');
    
    // Generar token de bienvenida
    const token = jwt.sign(
      {
        userId: 1,
        tenant_id: newTenant.id,
        rol: 'administrador',
        email: email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: '¡Bienvenido a NEURIAX! Tu cuenta ha sido creada exitosamente.',
      tenant: {
        id: newTenant.id,
        uuid: newTenant.uuid,
        nombre: newTenant.nombre,
        slug: newTenant.slug,
        email: newTenant.email,
        plan: plan.nombre,
        url: `https://${newTenant.slug}.neuriax.com`
      },
      token,
      next_steps: [
        'Configura tu perfil de negocio',
        'Añade tus servicios',
        'Registra a tus empleados',
        'Invita a tus clientes'
      ]
    });
    
  } catch (error) {
    console.error('Error registrando tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error de registro',
      message: error.message 
    });
  }
});

/**
 * GET /api/tenants/check-slug/:slug
 * Verificar disponibilidad de slug
 */
router.get('/check-slug/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  
  // Slugs reservados
  const reservedSlugs = ['www', 'api', 'admin', 'app', 'dashboard', 'login', 'register', 'demo', 'test', 'staging', 'dev'];
  
  if (reservedSlugs.includes(slug)) {
    return res.json({ available: false, reason: 'Subdominio reservado' });
  }
  
  const exists = getTenantBySlug(slug);
  res.json({ 
    available: !exists,
    slug: slug,
    url: `https://${slug}.neuriax.com`
  });
});

/**
 * GET /api/tenants/current
 * Obtener información del tenant actual
 */
router.get('/current', (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant no encontrado' 
      });
    }
    
    const plan = getPlanById(req.tenant.plan_id);
    
    res.json({
      success: true,
      tenant: {
        id: req.tenant.id,
        nombre: req.tenant.nombre,
        slug: req.tenant.slug,
        email: req.tenant.email,
        estado: req.tenant.estado,
        plan: {
          id: plan.id,
          nombre: plan.nombre,
          precio_mensual: plan.precio_mensual
        },
        configuracion: req.tenant.configuracion,
        limites: plan.limites,
        uso_actual: req.tenant.limites_uso,
        fecha_creacion: req.tenant.fecha_creacion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/tenants/current
 * Actualizar configuración del tenant actual
 */
router.put('/current', (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant no encontrado' 
      });
    }
    
    const { configuracion, telefono } = req.body;
    
    const updated = updateTenant(req.tenant.id, {
      telefono: telefono || req.tenant.telefono,
      configuracion: {
        ...req.tenant.configuracion,
        ...configuracion
      }
    });
    
    res.json({
      success: true,
      message: 'Configuración actualizada',
      tenant: {
        id: updated.id,
        nombre: updated.nombre,
        configuracion: updated.configuracion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tenants/upgrade
 * Cambiar plan del tenant
 */
router.post('/upgrade', (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant no encontrado' 
      });
    }
    
    const { plan_id, payment_method } = req.body;
    
    const newPlan = getPlanById(plan_id);
    if (!newPlan) {
      return res.status(400).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }
    
    const currentPlan = getPlanById(req.tenant.plan_id);
    
    // Aquí iría la integración con Stripe/PayPal
    // Por ahora solo actualizamos el plan
    
    const updated = updateTenant(req.tenant.id, {
      plan_id: plan_id,
      fecha_cambio_plan: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `Plan actualizado de ${currentPlan.nombre} a ${newPlan.nombre}`,
      tenant: {
        id: updated.id,
        plan: {
          id: newPlan.id,
          nombre: newPlan.nombre,
          precio_mensual: newPlan.precio_mensual
        }
      },
      payment_required: newPlan.precio_mensual > 0,
      checkout_url: newPlan.precio_mensual > 0 ? '/checkout' : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tenants/usage
 * Obtener estadísticas de uso del tenant
 */
router.get('/usage', (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant no encontrado' 
      });
    }
    
    const plan = getPlanById(req.tenant.plan_id);
    const uso = req.tenant.limites_uso;
    
    const calcPercentage = (current, limit) => {
      if (limit === -1) return 0; // Ilimitado
      return Math.round((current / limit) * 100);
    };
    
    res.json({
      success: true,
      usage: {
        usuarios: {
          actual: uso.usuarios_actuales,
          limite: plan.limites.usuarios,
          porcentaje: calcPercentage(uso.usuarios_actuales, plan.limites.usuarios),
          ilimitado: plan.limites.usuarios === -1
        },
        clientes: {
          actual: uso.clientes_actuales,
          limite: plan.limites.clientes,
          porcentaje: calcPercentage(uso.clientes_actuales, plan.limites.clientes),
          ilimitado: plan.limites.clientes === -1
        },
        citas_mes: {
          actual: uso.citas_este_mes,
          limite: plan.limites.citas_mes,
          porcentaje: calcPercentage(uso.citas_este_mes, plan.limites.citas_mes),
          ilimitado: plan.limites.citas_mes === -1
        },
        almacenamiento: {
          actual_mb: uso.almacenamiento_usado_mb,
          limite_mb: plan.limites.almacenamiento_mb,
          porcentaje: calcPercentage(uso.almacenamiento_usado_mb, plan.limites.almacenamiento_mb),
          ilimitado: false
        }
      },
      plan: {
        id: plan.id,
        nombre: plan.nombre
      },
      recomendacion: calcPercentage(uso.clientes_actuales, plan.limites.clientes) > 80 
        ? 'Estás cerca del límite de clientes. Considera actualizar tu plan.'
        : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tenants/register
 * PASO 11: Crear tenant + usuario admin en una sola llamada (Wizard de registro)
 */
router.post('/register', (req, res) => {
  try {
    const { 
      nombre_empresa, 
      email_admin, 
      password_admin, 
      plan_id 
    } = req.body;

    // Validaciones
    if (!nombre_empresa || !email_admin || !password_admin) {
      return res.status(400).json({
        success: false,
        message: 'nombre_empresa, email_admin y password_admin son requeridos'
      });
    }

    if (password_admin.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña debe tener mínimo 6 caracteres'
      });
    }

    loadTenantsDb();
    const { tenants, platform_users, subscriptions } = require('../database/database.json');

    // Verificar que el email no exista
    if (platform_users.find(u => u.email === email_admin)) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Generar ID único para el tenant
    const tenant_id = nombre_empresa.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    // Crear tenant
    const nuevoTenant = {
      id: tenant_id,
      nombre: nombre_empresa,
      descripcion: '',
      logo_url: '',
      sitio_web: '',
      estado: 'activo',
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    // Crear usuario admin del tenant
    const nuevoAdmin = {
      id: Math.max(...platform_users.map(u => u.id || 0), 0) + 1,
      tenant_id: tenant_id,
      username: email_admin.split('@')[0],
      password: bcrypt.hashSync(password_admin, 12),
      nombre_completo: email_admin,
      email: email_admin,
      rol: 'administrador',
      activo: 1,
      permisos: ['full_access'],
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    };

    // Crear suscripción inicial (Basic por default)
    const nuevaSuscripcion = {
      id: Math.max(...subscriptions.map(s => s.id || 0), 0) + 1,
      tenant_id: tenant_id,
      plan: plan_id || 'basic',
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
    tenants.push(nuevoTenant);
    platform_users.push(nuevoAdmin);
    subscriptions.push(nuevaSuscripcion);

    // Guardar cambios
    const db = require('fs').readFileSync(require('path').join(__dirname, '../database/database.json'), 'utf8');
    const jsonDb = JSON.parse(db);
    jsonDb.tenants = tenants;
    jsonDb.platform_users = platform_users;
    jsonDb.subscriptions = subscriptions;

    require('fs').writeFileSync(
      require('path').join(__dirname, '../database/database.json'),
      JSON.stringify(jsonDb, null, 2)
    );

    // Generar tokens
    const token = jwt.sign(
      { id: nuevoAdmin.id, tenant_id: tenant_id, email: email_admin },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: nuevoAdmin.id, tenant_id: tenant_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Tenant y usuario admin creados exitosamente',
      token: token,
      refreshToken: refreshToken,
      tenant: {
        id: tenant_id,
        nombre: nombre_empresa,
        estado: 'activo'
      },
      usuario: {
        id: nuevoAdmin.id,
        username: nuevoAdmin.username,
        email: nuevoAdmin.email,
        rol: nuevoAdmin.rol
      },
      suscripcion: {
        plan: nuevaSuscripcion.plan,
        estado: nuevaSuscripcion.estado,
        limites: nuevaSuscripcion.limites
      }
    });

  } catch (error) {
    console.error('Error en registro de tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando tenant y usuario'
    });
  }
});

module.exports = router;
