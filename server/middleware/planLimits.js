const plansService = require('../services/plansService');

/**
 * PASO 15 - Rate Limiting Middleware por Plan
 * 
 * Controla el número de llamadas API según el plan del tenant
 * Free: 1,000 calls/mes
 * Pro: 50,000 calls/mes
 * Enterprise: Ilimitado
 */

// Almacenar contadores de API calls por tenant y mes
const apiCallsStore = new Map();

// Estructura: {
//   tenantId: {
//     currentMonth: 'YYYY-MM',
//     calls: 1234,
//     lastReset: timestamp
//   }
// }

/**
 * Obtener el mes actual en formato YYYY-MM
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Obtener contador de API calls para un tenant
 */
function getTenantCallCounter(tenantId) {
  if (!apiCallsStore.has(tenantId)) {
    apiCallsStore.set(tenantId, {
      currentMonth: getCurrentMonth(),
      calls: 0,
      lastReset: Date.now()
    });
  }

  const counter = apiCallsStore.get(tenantId);
  const currentMonth = getCurrentMonth();

  // Si cambió de mes, resetear
  if (counter.currentMonth !== currentMonth) {
    counter.currentMonth = currentMonth;
    counter.calls = 0;
    counter.lastReset = Date.now();
  }

  return counter;
}

/**
 * Incrementar contador de API calls
 */
function incrementApiCalls(tenantId) {
  const counter = getTenantCallCounter(tenantId);
  counter.calls++;
  return counter.calls;
}

/**
 * Obtener límite de API calls según plan
 */
function getApiCallLimit(planId) {
  const plan = plansService.getPlan(planId);
  if (!plan) return 0;
  
  // Si es null, es ilimitado
  if (plan.limitations.api_calls_monthly === null) {
    return null; // ilimitado
  }
  
  return plan.limitations.api_calls_monthly;
}

/**
 * Middleware de Rate Limiting por Plan
 */
function rateLimitByPlan(req, res, next) {
  try {
    // Rutas públicas que NO deben estar limitadas
    const publicRoutes = [
      '/api/plans',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/health',
      '/api/docs',
      '/api/redoc',
      '/api/docs/json'
    ];

    // Verificar si es una ruta pública
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    if (isPublicRoute) {
      return next();
    }

    // ⭐ SUPER ADMIN - Sin límites nunca (usa req.usuario del middleware de auth)
    const user = req.usuario || req.user;
    if (user && (user.rol === 'super_admin' || user.is_platform_owner || user.unlimited_access)) {
      return next();
    }

    // Obtener tenantId del request
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      // Si no hay tenantId, permitir (rutas públicas)
      return next();
    }

    // ⭐ Tenant ilimitado (plataforma principal)
    if (req.tenant && (req.tenant.unlimited || req.tenant.is_platform_owner)) {
      return next();
    }

    // Obtener plan actual del tenant
    const tenantPlan = req.tenantPlan || 'basic'; // Default a basic
    
    // Obtener límite de API calls para este plan
    const limit = getApiCallLimit(tenantPlan);
    
    // Si es ilimitado (Enterprise), permitir directamente
    if (limit === null) {
      return next();
    }

    // Obtener contador actual
    const counter = getTenantCallCounter(tenantId);
    const currentCalls = counter.calls;

    // Verificar si superó el límite
    if (currentCalls >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Límite de API calls alcanzado para este mes',
        data: {
          plan: tenantPlan,
          limit: limit,
          currentCalls: currentCalls,
          monthReset: `${counter.currentMonth}-01`,
          nextResetDate: new Date(counter.lastReset + 30 * 24 * 60 * 60 * 1000).toISOString(),
          recommendation: tenantPlan === 'basic' ? 'Considera hacer upgrade al plan Pro o Enterprise' : 'Contacta a soporte'
        }
      });
    }

    // Incrementar contador
    const newCount = incrementApiCalls(tenantId);

    // Añadir headers informativos
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - newCount);
    res.setHeader('X-RateLimit-Used', newCount);
    res.setHeader('X-RateLimit-Plan', tenantPlan);
    res.setHeader('X-RateLimit-Reset', new Date(counter.lastReset + 30 * 24 * 60 * 60 * 1000).toISOString());

    next();
  } catch (error) {
    console.error('Error en Rate Limiting middleware:', error);
    // En caso de error, permitir el request (fail-open para no bloquear el sistema)
    next();
  }
}

/**
 * Middleware para verificar límite de usuarios concurrentes
 */
function concurrentUsersLimit(req, res, next) {
  try {
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return next();
    }

    const tenantPlan = req.tenantPlan || 'basic';
    const plan = plansService.getPlan(tenantPlan);
    
    if (!plan) {
      return next();
    }

    const concurrentLimit = plan.limitations.concurrent_users;
    
    // Si es ilimitado, permitir
    if (concurrentLimit === null) {
      return next();
    }

    // Aquí se podría implementar tracking de usuarios activos
    // Por ahora, solo añadimos el header informativo
    res.setHeader('X-Concurrent-Users-Limit', concurrentLimit);

    next();
  } catch (error) {
    console.error('Error en Concurrent Users middleware:', error);
    next();
  }
}

/**
 * Middleware para verificar límite de tamaño de archivo
 */
function fileSizeLimit(req, res, next) {
  try {
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return next();
    }

    const tenantPlan = req.tenantPlan || 'basic';
    const plan = plansService.getPlan(tenantPlan);
    
    if (!plan) {
      return next();
    }

    const fileSizeLimit = plan.limitations.file_upload_size_mb;
    
    // Expresar en bytes
    const fileSizeLimitBytes = fileSizeLimit * 1024 * 1024;
    
    // Configurar límite de tamaño en Express
    res.setHeader('X-File-Size-Limit-MB', fileSizeLimit);

    next();
  } catch (error) {
    console.error('Error en File Size middleware:', error);
    next();
  }
}

/**
 * Obtener estadísticas de uso de API calls para un tenant
 */
function getApiUsageStats(tenantId, planId) {
  const counter = getTenantCallCounter(tenantId);
  const limit = getApiCallLimit(planId);

  return {
    tenantId: tenantId,
    plan: planId,
    currentMonth: counter.currentMonth,
    apiCalls: {
      used: counter.calls,
      limit: limit,
      remaining: limit === null ? null : limit - counter.calls,
      percentageUsed: limit === null ? 0 : Math.round((counter.calls / limit) * 100)
    },
    monthStartDate: `${counter.currentMonth}-01`,
    lastResetDate: new Date(counter.lastReset).toISOString(),
    nextResetDate: new Date(counter.lastReset + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

/**
 * Resetear contador de un tenant (para testing o admin)
 */
function resetTenantCounter(tenantId) {
  apiCallsStore.set(tenantId, {
    currentMonth: getCurrentMonth(),
    calls: 0,
    lastReset: Date.now()
  });
}

/**
 * Obtener estadísticas globales (para admin)
 */
function getGlobalStats() {
  const stats = {
    totalTenants: apiCallsStore.size,
    currentMonth: getCurrentMonth(),
    tenants: []
  };

  for (const [tenantId, counter] of apiCallsStore.entries()) {
    if (counter.currentMonth === getCurrentMonth()) {
      stats.tenants.push({
        tenantId: tenantId,
        apiCalls: counter.calls
      });
    }
  }

  return stats;
}

/**
 * Middleware para validar límites de recursos (clientes, servicios, etc)
 * Uso: router.post('/clientes', validateResourceLimit('clientes'), createCliente)
 */
function validateResourceLimit(resourceType) {
  return async (req, res, next) => {
    try {
      const { getDatabase, loadDatabase } = require('../database/init');
      const authService = require('../services/authService');

      loadDatabase();
      const db = getDatabase();

      // Obtener usuario autenticado
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token requerido'
        });
      }

      const verification = authService.verifyAccessToken(token);
      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      const usuarioId = verification.decoded.id;
      const usuario = db.usuarios.find(u => u.id === usuarioId);

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si es cliente, permitir siempre
      if (usuario.tipo_usuario === 'cliente') {
        return next();
      }

      // Obtener plan de la empresa
      const tenant = db.tenants?.find(t => t.id === usuario.tenant_id);
      if (!tenant) {
        return res.status(400).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }

      const plan = tenant.plan || 'trial';

      // Contar recursos actuales
      let currentCount = 0;
      switch (resourceType) {
        case 'clientes':
          currentCount = (db.clientes || []).filter(c => c.tenant_id === usuario.tenant_id).length;
          break;
        case 'servicios':
          currentCount = (db.servicios || []).filter(s => s.tenant_id === usuario.tenant_id).length;
          break;
        case 'empleados':
          currentCount = (db.empleados || []).filter(e => e.tenant_id === usuario.tenant_id).length;
          break;
        case 'usuarios':
          currentCount = (db.usuarios || []).filter(u => u.tenant_id === usuario.tenant_id).length;
          break;
        default:
          currentCount = 0;
      }

      // Validar límite
      const validation = plansService.validateLimitAction(plan, resourceType, currentCount);

      if (!validation.allowed) {
        return res.status(403).json({
          success: false,
          message: validation.message,
          error: 'PLAN_LIMIT_REACHED',
          data: {
            limit: validation.limit,
            current: validation.current,
            remaining: 0,
            actionType: resourceType,
            planId: plan,
            planName: plansService.getPlan(plan)?.nombre
          }
        });
      }

      // Guardar información en request
      req.planLimits = {
        remaining: validation.remaining,
        limit: validation.limit,
        current: currentCount,
        planId: plan,
        planName: plansService.getPlan(plan)?.nombre
      };

      next();

    } catch (error) {
      console.error('Error en validateResourceLimit:', error);
      next(); // Permitir si hay error
    }
  };
}

/**
 * Middleware que obtiene información de límites sin bloquear
 * Útil para mostrar información en dashboard
 */
function attachPlanLimitsInfo(req, res, next) {
  try {
    const { getDatabase, loadDatabase } = require('../database/init');
    const authService = require('../services/authService');

    loadDatabase();
    const db = getDatabase();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) return next();

    const usuarioId = verification.decoded.id;
    const usuario = db.usuarios.find(u => u.id === usuarioId);

    if (!usuario) return next();

    const tenant = db.tenants?.find(t => t.id === usuario.tenant_id);
    if (!tenant) return next();

    // Obtener información de límites
    const limitsInfo = plansService.getAllLimits(tenant.plan || 'trial');

    // Obtener conteos actuales
    const currentCounts = {
      clientes: (db.clientes || []).filter(c => c.tenant_id === usuario.tenant_id).length,
      servicios: (db.servicios || []).filter(s => s.tenant_id === usuario.tenant_id).length,
      empleados: (db.empleados || []).filter(e => e.tenant_id === usuario.tenant_id).length,
      usuarios: (db.usuarios || []).filter(u => u.tenant_id === usuario.tenant_id).length
    };

    // Calcular días restantes del trial
    let diasRestantes = null;
    if (tenant.dias_trial && tenant.fecha_inicio_trial) {
      const fechaInicio = new Date(tenant.fecha_inicio_trial);
      const ahora = new Date();
      const diasTranscurridos = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
      diasRestantes = Math.max(0, tenant.dias_trial - diasTranscurridos);
    }

    req.dashboardLimits = {
      plan: tenant.plan || 'trial',
      limits: limitsInfo,
      usage: currentCounts,
      tenant: {
        id: tenant.id,
        nombre: tenant.nombre,
        estado: tenant.estado,
        diasTrial: tenant.dias_trial,
        fechaInicio: tenant.fecha_inicio_trial,
        diasRestantes: diasRestantes
      }
    };

    next();

  } catch (error) {
    console.error('Error en attachPlanLimitsInfo:', error);
    next();
  }
}

module.exports = {
  rateLimitByPlan,
  concurrentUsersLimit,
  fileSizeLimit,
  getTenantCallCounter,
  incrementApiCalls,
  getApiCallLimit,
  getApiUsageStats,
  resetTenantCounter,
  getGlobalStats,
  validateResourceLimit,
  attachPlanLimitsInfo
};
