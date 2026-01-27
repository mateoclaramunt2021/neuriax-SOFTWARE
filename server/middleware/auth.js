const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

// ============================================================
// PASO 3: MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN MEJORADO
// Sistema SaaS Multi-Tenant con permisos granulares
// ============================================================

// Middleware para verificar autenticación con nuevo sistema
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acceso no autorizado. Token requerido' 
    });
  }

  try {
    // PASO 3: Usar authService para verificar
    const verification = authService.verifyAccessToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({ 
        success: false, 
        message: verification.error || 'Token inválido'
      });
    }

    req.usuario = verification.decoded;
    req.permissions = verification.decoded.permissions || [];
    req.tenantId = verification.decoded.tenantId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
}

// Middleware para verificar rol de administrador
function verificarAdmin(req, res, next) {
  const rolesAdmin = ['administrador', 'SUPER_ADMIN', 'OWNER', 'ADMIN', 'super_admin', 'admin'];
  if (!rolesAdmin.includes(req.usuario.rol)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requiere rol de administrador' 
    });
  }
  next();
}

// PASO 3: Middleware para verificar permisos específicos
function verificarPermiso(...permisosRequeridos) {
  return (req, res, next) => {
    // Super Admin siempre tiene acceso
    if (req.usuario.rol === 'SUPER_ADMIN' || req.usuario.rol === 'super_admin' || 
        req.usuario.rol === 'administrador' || req.usuario.is_platform_owner || 
        req.usuario.unlimited_access) {
      return next();
    }

    // Verificar si tiene permiso "*" (acceso total)
    if (req.permissions.includes('*')) {
      return next();
    }

    // Verificar si tiene al menos uno de los permisos requeridos
    const tienePermiso = permisosRequeridos.some(permiso => 
      req.permissions.includes(permiso)
    );

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Requiere permiso: ${permisosRequeridos.join(' o ')}`
      });
    }

    next();
  };
}

// PASO 3: Middleware para verificar TODOS los permisos (AND)
function verificarTodosPermisos(...permisosRequeridos) {
  return (req, res, next) => {
    if (req.usuario.rol === 'SUPER_ADMIN' || req.usuario.rol === 'super_admin' || 
        req.usuario.rol === 'administrador' || req.usuario.is_platform_owner) {
      return next();
    }

    // Verificar si tiene permiso "*" (acceso total)
    if (req.permissions.includes('*')) {
      return next();
    }

    const tieneTodsPermisos = permisosRequeridos.every(permiso => 
      req.permissions.includes(permiso)
    );

    if (!tieneTodsPermisos) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. No tiene todos los permisos necesarios'
      });
    }

    next();
  };
}

// PASO 3: Middleware para verificar propiedad del tenant
function verificarTenant(req, res, next) {
  const tenantIdFromRequest = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  
  // Si es SUPER_ADMIN puede acceder a cualquier tenant
  if (req.usuario.rol === 'SUPER_ADMIN') {
    return next();
  }

  // Verificar que el tenant del token coincide con el solicitado
  if (tenantIdFromRequest && req.tenantId !== tenantIdFromRequest) {
    return res.status(403).json({
      success: false,
      message: 'No tiene acceso a este tenant'
    });
  }

  next();
}

// PASO 3: Middleware para rate limiting básico por usuario
const rateLimitStore = new Map();

function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.usuario?.id || req.ip;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, startTime: now });
      return next();
    }

    const userLimit = rateLimitStore.get(key);
    
    if (now - userLimit.startTime > windowMs) {
      rateLimitStore.set(key, { count: 1, startTime: now });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intente más tarde.',
        retryAfter: Math.ceil((userLimit.startTime + windowMs - now) / 1000)
      });
    }

    userLimit.count++;
    next();
  };
}

// Limpiar rate limit store cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.startTime > 300000) { // 5 minutos
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// Exportar permisos para uso en rutas
const PERMISOS = authService.PERMISSIONS;

module.exports = { 
  verificarToken, 
  verificarAdmin,
  verificarPermiso,
  verificarTodosPermisos,
  verificarTenant,
  rateLimiter,
  PERMISOS
};
