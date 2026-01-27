/**
 * NEURIAX SaaS Platform - Servicio de Autenticación Avanzado
 * PASO 3: Sistema JWT con Refresh Tokens, Roles y Permisos
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuración de tokens
const config = {
  accessTokenSecret: process.env.JWT_SECRET || 'NEURIAX_SaaS_Platform_2026_SecretKey',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'NEURIAX_Refresh_Token_2026_SecretKey',
  accessTokenExpiry: '15m',      // Access token expira en 15 minutos
  refreshTokenExpiry: '7d',      // Refresh token expira en 7 días
  maxSessionsPerUser: 5          // Máximo de sesiones simultáneas
};

// Roles y permisos del sistema
const ROLES = {
  SUPER_ADMIN: 'super_admin',    // Admin de NEURIAX (acceso total)
  OWNER: 'owner',                // Dueño del negocio (tenant)
  ADMIN: 'admin',                // Administrador del negocio
  MANAGER: 'manager',            // Gerente
  EMPLOYEE: 'employee',          // Empleado
  READONLY: 'readonly'           // Solo lectura
};

// Permisos por módulo
const PERMISSIONS = {
  // Dashboard
  'dashboard:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.READONLY],
  
  // Clientes
  'clientes:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.READONLY],
  'clientes:create': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  'clientes:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
  'clientes:delete': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  
  // Servicios
  'servicios:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.READONLY],
  'servicios:create': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  'servicios:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  'servicios:delete': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  
  // Citas
  'citas:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.READONLY],
  'citas:create': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  'citas:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  'citas:delete': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
  
  // Ventas/POS
  'ventas:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.READONLY],
  'ventas:create': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  'ventas:anular': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  
  // Caja
  'caja:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.READONLY],
  'caja:operar': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
  'caja:cerrar': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  
  // Inventario
  'inventario:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.READONLY],
  'inventario:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
  
  // Empleados
  'empleados:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.READONLY],
  'empleados:create': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  'empleados:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  'empleados:delete': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  
  // Reportes
  'reportes:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.READONLY],
  'reportes:export': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
  
  // Configuración
  'configuracion:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  'configuracion:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  
  // Facturación
  'facturacion:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.READONLY],
  'facturacion:create': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  
  // Usuarios del sistema
  'usuarios:view': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.ADMIN],
  'usuarios:create': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  'usuarios:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  'usuarios:delete': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  
  // Tenant (solo owner y super_admin)
  'tenant:view': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  'tenant:edit': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  'tenant:billing': [ROLES.SUPER_ADMIN, ROLES.OWNER]
};

// Base de datos de refresh tokens (en producción usar Redis)
let refreshTokensDB = [];
const REFRESH_TOKENS_FILE = path.join(__dirname, '../database/refresh_tokens.json');

// Cargar refresh tokens desde archivo
const loadRefreshTokens = () => {
  try {
    if (fs.existsSync(REFRESH_TOKENS_FILE)) {
      const data = fs.readFileSync(REFRESH_TOKENS_FILE, 'utf8');
      refreshTokensDB = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error cargando refresh tokens:', error.message);
    refreshTokensDB = [];
  }
};

// Guardar refresh tokens
const saveRefreshTokens = () => {
  try {
    fs.writeFileSync(REFRESH_TOKENS_FILE, JSON.stringify(refreshTokensDB, null, 2));
  } catch (error) {
    console.error('Error guardando refresh tokens:', error.message);
  }
};

// Inicializar
loadRefreshTokens();

/**
 * Generar Access Token
 */
const generateAccessToken = (user, tenantId = null) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    rol: user.rol,
    tenant_id: tenantId || user.tenant_id,
    permissions: getPermissionsForRole(user.rol),
    type: 'access'
  };

  return jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiry,
    issuer: 'NEURIAX',
    audience: 'neuriax-saas'
  });
};

/**
 * Generar Refresh Token
 */
const generateRefreshToken = (user, deviceInfo = {}) => {
  const tokenId = crypto.randomBytes(32).toString('hex');
  
  const payload = {
    id: user.id,
    tokenId: tokenId,
    type: 'refresh'
  };

  const token = jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiry,
    issuer: 'NEURIAX'
  });

  // Almacenar refresh token
  const refreshTokenData = {
    tokenId,
    userId: user.id,
    token,
    device: deviceInfo.userAgent || 'Unknown',
    ip: deviceInfo.ip || 'Unknown',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isValid: true
  };

  // Limpiar tokens antiguos del usuario (mantener solo maxSessionsPerUser)
  const userTokens = refreshTokensDB.filter(t => t.userId === user.id && t.isValid);
  if (userTokens.length >= config.maxSessionsPerUser) {
    // Invalidar el token más antiguo
    const oldestToken = userTokens.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    oldestToken.isValid = false;
  }

  refreshTokensDB.push(refreshTokenData);
  saveRefreshTokens();

  return token;
};

/**
 * Verificar Access Token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.accessTokenSecret, {
      issuer: 'NEURIAX',
      audience: 'neuriax-saas'
    });
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Verificar Refresh Token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.refreshTokenSecret, {
      issuer: 'NEURIAX'
    });

    // Verificar que el token existe y está activo
    const storedToken = refreshTokensDB.find(t => 
      t.tokenId === decoded.tokenId && 
      t.userId === decoded.id && 
      t.isValid
    );

    if (!storedToken) {
      return { valid: false, error: 'Token revocado o no encontrado' };
    }

    return { valid: true, decoded, storedToken };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Refrescar tokens
 */
const refreshTokens = (refreshToken, deviceInfo = {}) => {
  const verification = verifyRefreshToken(refreshToken);
  
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  // Obtener usuario (esto debería venir de la base de datos)
  const { getDatabase } = require('../database/init');
  const db = getDatabase();
  const user = db.usuarios.find(u => u.id === verification.decoded.id);

  if (!user || user.activo !== 1) {
    return { success: false, error: 'Usuario no válido' };
  }

  // Invalidar el refresh token usado (rotación de tokens)
  verification.storedToken.isValid = false;
  saveRefreshTokens();

  // Generar nuevos tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user, deviceInfo);

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900 // 15 minutos en segundos
  };
};

/**
 * Revocar refresh token (logout)
 */
const revokeRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret, {
      issuer: 'NEURIAX'
    });

    const storedToken = refreshTokensDB.find(t => t.tokenId === decoded.tokenId);
    if (storedToken) {
      storedToken.isValid = false;
      saveRefreshTokens();
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Revocar todos los refresh tokens de un usuario (logout de todos los dispositivos)
 */
const revokeAllUserTokens = (userId) => {
  refreshTokensDB.forEach(token => {
    if (token.userId === userId) {
      token.isValid = false;
    }
  });
  saveRefreshTokens();
  return { success: true, message: 'Todas las sesiones han sido cerradas' };
};

/**
 * Obtener sesiones activas de un usuario
 */
const getUserSessions = (userId) => {
  return refreshTokensDB
    .filter(t => t.userId === userId && t.isValid)
    .map(t => ({
      device: t.device,
      ip: t.ip,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt
    }));
};

/**
 * Obtener permisos para un rol
 */
const getPermissionsForRole = (rol) => {
  const permissions = [];
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    if (roles.includes(rol)) {
      permissions.push(permission);
    }
  }
  return permissions;
};

/**
 * Verificar si un usuario tiene un permiso específico
 */
const hasPermission = (userRol, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRol);
};

/**
 * Hash de contraseña
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Verificar contraseña
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generar token de recuperación de contraseña
 */
const generatePasswordResetToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hora
  
  return {
    token,
    expires,
    hash: crypto.createHash('sha256').update(token).digest('hex')
  };
};

/**
 * Limpiar tokens expirados (ejecutar periódicamente)
 */
const cleanupExpiredTokens = () => {
  const now = new Date();
  refreshTokensDB = refreshTokensDB.filter(t => {
    const expiresAt = new Date(t.expiresAt);
    return expiresAt > now || t.isValid;
  });
  saveRefreshTokens();
};

// Limpiar tokens expirados cada hora
setInterval(cleanupExpiredTokens, 3600000);

module.exports = {
  // Configuración
  config,
  ROLES,
  PERMISSIONS,
  
  // Tokens
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens,
  revokeRefreshToken,
  revokeAllUserTokens,
  
  // Sesiones
  getUserSessions,
  
  // Permisos
  getPermissionsForRole,
  hasPermission,
  
  // Passwords
  hashPassword,
  verifyPassword,
  generatePasswordResetToken,
  
  // Mantenimiento
  cleanupExpiredTokens
};
