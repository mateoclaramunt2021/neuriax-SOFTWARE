/**
 * NEURIAX SaaS Platform - Multi-Tenant Middleware
 * PASO 2: Arquitectura Multi-Tenant
 * 
 * Este middleware identifica y valida el tenant (negocio) en cada request.
 * Soporta múltiples métodos de identificación:
 * 1. Subdominio: salon1.neuriax.com
 * 2. Header: X-Tenant-ID
 * 3. JWT Token: tenant_id en el payload
 */

const fs = require('fs');
const path = require('path');

// Base de datos de tenants
const tenantsDbPath = path.join(__dirname, '../database/tenants.json');

// Estructura de tenants
let tenantsDb = {
  tenants: [],
  plans: [
    {
      id: 'basic',
      nombre: 'Básico',
      precio_mensual: 39,
      precio_anual: 390,
      limites: {
        usuarios: 2,
        clientes: 100,
        citas_mes: 500,
        empleados: 2,
        almacenamiento_mb: 5000,
        integraciones: false,
        soporte: 'email',
        api_access: false,
        white_label: false,
        backups: 'semanal'
      }
    },
    {
      id: 'pro',
      nombre: 'Profesional',
      precio_mensual: 79,
      precio_anual: 790,
      limites: {
        usuarios: 10,
        clientes: -1,
        citas_mes: -1,
        empleados: 10,
        almacenamiento_mb: 50000,
        integraciones: true,
        soporte: 'prioritario',
        api_access: true,
        white_label: false,
        backups: 'diario'
      }
    },
    {
      id: 'enterprise',
      nombre: 'Enterprise',
      precio_mensual: 149,
      precio_anual: 1490,
      limites: {
        usuarios: -1, // Ilimitado
        clientes: -1,
        citas_mes: -1,
        empleados: -1,
        almacenamiento_mb: 100000,
        integraciones: true,
        soporte: 'telefono',
        api_access: true,
        white_label: true,
        backups: 'tiempo_real'
      }
    }
  ]
};

// Cargar base de datos de tenants
function loadTenantsDb() {
  try {
    if (fs.existsSync(tenantsDbPath)) {
      const data = fs.readFileSync(tenantsDbPath, 'utf8');
      tenantsDb = JSON.parse(data);
    } else {
      // Crear tenant por defecto (demo)
      initDefaultTenant();
    }
  } catch (error) {
    console.error('Error cargando tenants:', error);
    initDefaultTenant();
  }
  return tenantsDb;
}

// Guardar base de datos de tenants
function saveTenantsDb() {
  fs.writeFileSync(tenantsDbPath, JSON.stringify(tenantsDb, null, 2), 'utf8');
}

// Crear tenant por defecto
function initDefaultTenant() {
  const defaultTenant = {
    id: 'default',
    uuid: generateUUID(),
    nombre: 'Demo NEURIAX',
    slug: 'demo',
    email: 'demo@neuriax.com',
    telefono: '',
    plan_id: 'professional',
    estado: 'activo',
    fecha_creacion: new Date().toISOString(),
    fecha_expiracion: null, // null = sin expiración
    configuracion: {
      nombre_negocio: 'NEURIAX Salon Manager',
      logo_url: null,
      color_primario: '#8b5cf6',
      color_secundario: '#a855f7',
      timezone: 'Europe/Madrid',
      idioma: 'es',
      moneda: 'EUR',
      formato_fecha: 'DD/MM/YYYY',
      formato_hora: '24h'
    },
    limites_uso: {
      usuarios_actuales: 1,
      clientes_actuales: 0,
      citas_este_mes: 0,
      almacenamiento_usado_mb: 0
    },
    metadata: {
      ip_registro: null,
      user_agent: null,
      referral: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null
    }
  };
  
  tenantsDb.tenants = [defaultTenant];
  saveTenantsDb();
  console.log('✅ Tenant por defecto creado: demo.neuriax.com');
}

// Generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Obtener tenant por ID
function getTenantById(tenantId) {
  loadTenantsDb();
  return tenantsDb.tenants.find(t => t.id === tenantId || t.uuid === tenantId);
}

// Obtener tenant por slug
function getTenantBySlug(slug) {
  loadTenantsDb();
  return tenantsDb.tenants.find(t => t.slug === slug);
}

// Obtener tenant por email
function getTenantByEmail(email) {
  loadTenantsDb();
  return tenantsDb.tenants.find(t => t.email === email);
}

// Crear nuevo tenant
function createTenant(data) {
  loadTenantsDb();
  
  // Verificar si el slug ya existe
  if (tenantsDb.tenants.find(t => t.slug === data.slug)) {
    throw new Error('El subdominio ya está en uso');
  }
  
  // Verificar si el email ya existe
  if (tenantsDb.tenants.find(t => t.email === data.email)) {
    throw new Error('El email ya está registrado');
  }
  
  const newTenant = {
    id: `tenant_${Date.now()}`,
    uuid: generateUUID(),
    nombre: data.nombre,
    slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    email: data.email,
    telefono: data.telefono || '',
    plan_id: data.plan_id || 'basic',
    estado: 'activo',
    fecha_creacion: new Date().toISOString(),
    fecha_expiracion: null,
    configuracion: {
      nombre_negocio: data.nombre_negocio || data.nombre,
      logo_url: null,
      color_primario: data.color_primario || '#8b5cf6',
      color_secundario: '#a855f7',
      timezone: data.timezone || 'Europe/Madrid',
      idioma: data.idioma || 'es',
      moneda: data.moneda || 'EUR',
      formato_fecha: 'DD/MM/YYYY',
      formato_hora: '24h'
    },
    limites_uso: {
      usuarios_actuales: 1,
      clientes_actuales: 0,
      citas_este_mes: 0,
      almacenamiento_usado_mb: 0
    },
    metadata: {
      ip_registro: data.ip || null,
      user_agent: data.user_agent || null,
      referral: data.referral || null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null
    }
  };
  
  tenantsDb.tenants.push(newTenant);
  saveTenantsDb();
  
  return newTenant;
}

// Actualizar tenant
function updateTenant(tenantId, data) {
  loadTenantsDb();
  const index = tenantsDb.tenants.findIndex(t => t.id === tenantId || t.uuid === tenantId);
  
  if (index === -1) {
    throw new Error('Tenant no encontrado');
  }
  
  tenantsDb.tenants[index] = {
    ...tenantsDb.tenants[index],
    ...data,
    id: tenantsDb.tenants[index].id, // Proteger ID
    uuid: tenantsDb.tenants[index].uuid, // Proteger UUID
    fecha_creacion: tenantsDb.tenants[index].fecha_creacion // Proteger fecha
  };
  
  saveTenantsDb();
  return tenantsDb.tenants[index];
}

// Obtener plan por ID
function getPlanById(planId) {
  return tenantsDb.plans.find(p => p.id === planId);
}

// Obtener todos los planes
function getAllPlans() {
  return tenantsDb.plans;
}

// Verificar límites del tenant
function checkTenantLimits(tenant, limitType, currentValue) {
  const plan = getPlanById(tenant.plan_id);
  if (!plan) return { allowed: true };
  
  const limit = plan.limites[limitType];
  
  // -1 significa ilimitado
  if (limit === -1) return { allowed: true };
  
  if (currentValue >= limit) {
    return {
      allowed: false,
      message: `Has alcanzado el límite de ${limitType} de tu plan ${plan.nombre}. Actualiza tu plan para continuar.`,
      limit: limit,
      current: currentValue,
      plan: plan.nombre
    };
  }
  
  return { allowed: true, remaining: limit - currentValue };
}

// Middleware de identificación de tenant
function tenantMiddleware(req, res, next) {
  let tenantId = null;
  let tenant = null;
  
  // Método 1: Header X-Tenant-ID
  if (req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'];
    tenant = getTenantById(tenantId);
  }
  
  // Método 2: Subdominio (salon1.neuriax.com)
  if (!tenant && req.hostname) {
    const hostParts = req.hostname.split('.');
    if (hostParts.length >= 2 && hostParts[0] !== 'www' && hostParts[0] !== 'api') {
      tenant = getTenantBySlug(hostParts[0]);
    }
  }
  
  // Método 3: Token JWT (si existe en req.user)
  if (!tenant && req.user && req.user.tenant_id) {
    tenant = getTenantById(req.user.tenant_id);
  }
  
  // Método 4: Query parameter (solo para desarrollo)
  if (!tenant && process.env.NODE_ENV !== 'production' && req.query.tenant) {
    tenant = getTenantBySlug(req.query.tenant) || getTenantById(req.query.tenant);
  }
  
  // Si no se encontró tenant, usar el default
  if (!tenant) {
    tenant = getTenantBySlug('demo') || getTenantById('default');
  }
  
  // Verificar estado del tenant
  if (tenant && tenant.estado !== 'activo') {
    return res.status(403).json({
      success: false,
      error: 'Cuenta suspendida',
      message: 'Tu cuenta ha sido suspendida. Contacta con soporte para más información.'
    });
  }
  
  // Verificar expiración
  if (tenant && tenant.fecha_expiracion) {
    const expDate = new Date(tenant.fecha_expiracion);
    if (expDate < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Suscripción expirada',
        message: 'Tu suscripción ha expirado. Renueva tu plan para continuar usando el servicio.'
      });
    }
  }
  
  // Adjuntar tenant al request
  req.tenant = tenant;
  req.tenantId = tenant ? tenant.id : null;
  
  // Adjuntar plan y límites
  if (tenant) {
    req.tenantPlan = getPlanById(tenant.plan_id);
    req.checkLimit = (limitType) => {
      return checkTenantLimits(tenant, limitType, tenant.limites_uso[`${limitType}_actuales`] || 0);
    };
  }
  
  next();
}

// Middleware para verificar feature del plan
function requirePlanFeature(feature) {
  return (req, res, next) => {
    if (!req.tenantPlan) {
      return res.status(403).json({
        success: false,
        error: 'Plan no encontrado',
        message: 'No se pudo determinar tu plan de suscripción.'
      });
    }
    
    const limit = req.tenantPlan.limites[feature];
    
    // Si es booleano, verificar que esté activo
    if (typeof limit === 'boolean' && !limit) {
      return res.status(403).json({
        success: false,
        error: 'Función no disponible',
        message: `La función "${feature}" no está disponible en tu plan ${req.tenantPlan.nombre}. Actualiza tu plan para acceder.`,
        upgrade_url: '/planes'
      });
    }
    
    next();
  };
}

// Inicializar al cargar el módulo
loadTenantsDb();

module.exports = {
  tenantMiddleware,
  requirePlanFeature,
  getTenantById,
  getTenantBySlug,
  getTenantByEmail,
  createTenant,
  updateTenant,
  getPlanById,
  getAllPlans,
  checkTenantLimits,
  generateUUID,
  loadTenantsDb,
  saveTenantsDb
};
