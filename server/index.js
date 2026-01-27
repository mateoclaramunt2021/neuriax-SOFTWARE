const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const compression = require('compression');
const helmet = require('helmet');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const logger = require('./logger');
const validation = require('./utils/validation');
const validationMiddleware = require('./middleware/validation'); // Middleware de sanitización y seguridad
require('dotenv').config();

// 🔔 SEMANA 1: Servicios de SMS/Recordatorios
const twilioService = require('./services/twilioService');

// Importar funciones de base de datos
const { getDatabase, saveDatabase, loadDatabase, initDatabase } = require('./database/init');

// Importar middleware de tenant
const { getTenantFromRequest, assignTenantPlan, setDatabase } = require('./middleware/tenantMiddleware');

// Importar middleware de rate limiting - PASO 15
const { 
  rateLimitByPlan, 
  concurrentUsersLimit, 
  fileSizeLimit,
  validateResourceLimit,
  attachPlanLimitsInfo
} = require('./middleware/planLimits');

// Importar routers
const ventasRouter = require('./routes/ventas');
const reportesRouter = require('./routes/reportes');
const cajaRouter = require('./routes/caja');
const citasRouter = require('./routes/citas');
const notificacionesRouter = require('./routes/notificaciones'); // PASO 33
const analyticsRouter = require('./routes/analytics'); // PASO 34
const tenantsRouter = require('./routes/tenants'); // PASO 2 - Multi-Tenant SaaS
const tenantsCreateRouter = require('./routes/tenants-create'); // PASO 8 - Crear nuevos tenants
const plansRouter = require('./routes/plans'); // PASO 14 - SaaS Plans & Monetization
const usageRouter = require('./routes/usage'); // PASO 15 - Usage & Rate Limiting
const webhooksRouter = require('./routes/webhooks'); // PASO 17 - Webhooks y Eventos
const authRouter = require('./routes/auth'); // 🔐 DUAL AUTH SYSTEM - Profesionales vs Clientes
const { backupService, createBackupRoutes } = require('./services/backupService'); // PASO 48
const { facturacionService, createFacturacionRoutes } = require('./services/facturacionService'); // PASO 50
const { contabilidadService, createContabilidadRoutes } = require('./services/contabilidadService'); // PASO 51
const { createDocsRoutes } = require('./docs'); // PASO 52 - API Documentation
const subscriptionsRouter = require('./routes/subscriptions'); // Sistema de Suscripciones y Pagos
const salonRouter = require('./routes/salon'); // Setup de perfil de salón

// 🔔 SEMANA 1: Nuevas rutas para Stripe y Cambio de Citas
const stripeRouter = require('./routes/stripe'); // SEMANA 1 - Pagos con Stripe
const cambioCitasRouter = require('./routes/cambio-citas'); // SEMANA 1 - Cambio de citas online

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'database', 'database.json');
const JWT_SECRET = process.env.JWT_SECRET || 'NEURIAX_SaaS_Platform_2026_SecretKey';
const JWT_EXPIRY = '8h';

// CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
};

// Middleware
app.use(compression()); // Compression middleware - GZIP enabled
app.use(helmet()); // Helmet security middleware - HTTP headers protection
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 🔒 SEGURIDAD: Middleware de sanitización y prevención de inyección
app.use(validationMiddleware.sanitizeBody);
app.use(validationMiddleware.preventInjection);

// PASO 6 - Middleware de Tenant (obtener tenantId del request)
app.use(getTenantFromRequest);

// PASO 15 - Middleware para asignar plan del tenant
app.use(assignTenantPlan);

// PASO 15 - Middleware de Rate Limiting por Plan
app.use(rateLimitByPlan);

// PASO 15 - Middleware de límites adicionales
app.use(concurrentUsersLimit);
app.use(fileSizeLimit);

// ==================== BASE DE DATOS ====================
let db = {};

// Cargar e Inicializar BD al iniciar
loadDatabase();
initDatabase();
logger.info('Base de datos inicializada correctamente');

// ==================== MIDDLEWARE DE LOGGING ====================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req.method, req.path, res.statusCode, duration);
  });
  next();
});

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
}

// ==================== PASO 13: RATE LIMITING & BRUTE FORCE PROTECTION ====================

// Rate limiters for different endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false
  // skip: (req, res) => {
  //   // No aplicar rate limit a IPs de confianza (localhost en desarrollo)
  //   return req.ip === '127.0.0.1' || req.ip === '::1';
  // }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutos
  max: 3, // 3 intentos máximo
  message: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 30 minutos.',
  standardHeaders: true,
  legacyHeaders: false
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos máximo (para validar código + cambiar contraseña)
  message: 'Demasiados intentos de reset de contraseña. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false
});

const login2faLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos máximo
  message: 'Demasiados intentos de 2FA. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false
});

// Registro de intentos fallidos para auditoría
const failedAttempts = new Map();

function logFailedAttempt(identifier, type, ip) {
  const key = `${identifier}:${type}`;
  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, []);
  }
  
  const attempts = failedAttempts.get(key);
  attempts.push({
    timestamp: new Date().toISOString(),
    ip: ip,
    type: type
  });
  
  // Limpiar intentos antiguos (más de 1 hora)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const filteredAttempts = attempts.filter(a => new Date(a.timestamp).getTime() > oneHourAgo);
  failedAttempts.set(key, filteredAttempts);
  
  logger.logAuth(identifier, false, `Intento fallido de ${type} - IP: ${ip}`);
}

function getFailedAttemptCount(identifier, type) {
  const key = `${identifier}:${type}`;
  const attempts = failedAttempts.get(key) || [];
  
  // Contar solo intentos en los últimos 15 minutos
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  return attempts.filter(a => new Date(a.timestamp).getTime() > fifteenMinutesAgo).length;
}

// ==================== PASO 14: SESSION MANAGEMENT & DEVICE FINGERPRINTING ====================

// Almacenamiento en memoria de sesiones activas
const activeSessions = new Map();

// Almacenamiento de dispositivos conocidos por usuario
const userDevices = new Map();

/**
 * Generar fingerprint único del dispositivo
 * Basado en User-Agent, IP, y navegador
 */
function generateDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  
  // Extraer información del navegador
  const browserInfo = {
    userAgent: userAgent.substring(0, 100),
    ip: ip,
    timestamp: new Date().toISOString()
  };
  
  // Crear hash del fingerprint
  const fingerprintString = JSON.stringify(browserInfo);
  const hash = crypto.createHash('sha256').update(fingerprintString).digest('hex');
  
  return {
    id: hash,
    userAgent: userAgent,
    ip: ip,
    browser: extractBrowserInfo(userAgent),
    os: extractOSInfo(userAgent)
  };
}

/**
 * Extraer información del navegador desde User-Agent
 */
function extractBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/([0-9]+)/ },
    { name: 'Firefox', regex: /Firefox\/([0-9]+)/ },
    { name: 'Safari', regex: /Safari\/([0-9]+)/ },
    { name: 'Edge', regex: /Edg\/([0-9]+)/ },
    { name: 'IE', regex: /Trident.*rv:([0-9]+)/ }
  ];
  
  for (const browser of browsers) {
    const match = userAgent.match(browser.regex);
    if (match) {
      return `${browser.name} ${match[1]}`;
    }
  }
  
  return 'Unknown Browser';
}

/**
 * Extraer información del SO desde User-Agent
 */
function extractOSInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  const osPatterns = [
    { name: 'Windows', regex: /Windows NT/ },
    { name: 'macOS', regex: /Macintosh/ },
    { name: 'Linux', regex: /Linux/ },
    { name: 'Android', regex: /Android/ },
    { name: 'iOS', regex: /iPhone|iPad/ }
  ];
  
  for (const os of osPatterns) {
    if (os.regex.test(userAgent)) {
      return os.name;
    }
  }
  
  return 'Unknown OS';
}

/**
 * Crear una nueva sesión
 */
function createSession(userId, deviceFingerprint, refreshToken) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const session = {
    id: sessionId,
    userId: userId,
    deviceId: deviceFingerprint.id,
    browser: deviceFingerprint.browser,
    os: deviceFingerprint.os,
    ip: deviceFingerprint.ip,
    userAgent: deviceFingerprint.userAgent,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    refreshToken: refreshToken,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
  };
  
  activeSessions.set(sessionId, session);
  
  // Guardar sesión en base de datos también
  loadDatabase();
  const db = getDatabase();
  if (!db.sessions) db.sessions = [];
  db.sessions.push(session);
  saveDatabase(db);
  
  return session;
}

/**
 * Actualizar última actividad de sesión
 */
function updateSessionActivity(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
  }
}

/**
 * Detectar si es un dispositivo nuevo o conocido
 */
function isNewDevice(userId, deviceFingerprint) {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.knownDevices) db.knownDevices = [];
  
  const knownDevice = db.knownDevices.find(d => 
    d.userId === userId && d.deviceId === deviceFingerprint.id
  );
  
  if (!knownDevice) {
    // Dispositivo nuevo - crear registro
    const newDevice = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      deviceId: deviceFingerprint.id,
      browser: deviceFingerprint.browser,
      os: deviceFingerprint.os,
      ip: deviceFingerprint.ip,
      userAgent: deviceFingerprint.userAgent,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      isTrusted: false,
      alertSent: false
    };
    
    db.knownDevices.push(newDevice);
    saveDatabase(db);
    
    return { isNew: true, device: newDevice };
  }
  
  return { isNew: false, device: knownDevice };
}

/**
 * Marcar dispositivo como de confianza
 */
function trustDevice(userId, deviceId) {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.knownDevices) db.knownDevices = [];
  
  const device = db.knownDevices.find(d => 
    d.userId === userId && d.deviceId === deviceId
  );
  
  if (device) {
    device.isTrusted = true;
    device.trustedAt = new Date().toISOString();
    saveDatabase(db);
    return true;
  }
  
  return false;
}

/**
 * Generar refresh token
 */
function generateRefreshToken(userId, sessionId) {
  return jwt.sign(
    {
      id: userId,
      sessionId: sessionId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Validar y rotar refresh token
 */
function rotateRefreshToken(oldRefreshToken) {
  try {
    const decoded = jwt.verify(oldRefreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return { valid: false, error: 'Token inválido' };
    }
    
    // Crear nuevo token
    const newRefreshToken = generateRefreshToken(decoded.id, decoded.sessionId);
    
    return { 
      valid: true, 
      token: newRefreshToken,
      userId: decoded.id,
      sessionId: decoded.sessionId
    };
  } catch (err) {
    return { valid: false, error: 'Token expirado o inválido' };
  }
}

/**
 * Verificar y limpiar sesiones expiradas
 */
function cleanupExpiredSessions() {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.sessions) return;
  
  const now = new Date();
  db.sessions = db.sessions.filter(session => {
    const expiresAt = new Date(session.expiresAt);
    return expiresAt > now;
  });
  
  saveDatabase(db);
}

/**
 * Revocar sesión específica
 */
function revokeSession(userId, sessionId) {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.sessions) return false;
  
  const session = db.sessions.find(s => s.id === sessionId && s.userId === userId);
  if (session) {
    session.isActive = false;
    session.revokedAt = new Date().toISOString();
    saveDatabase(db);
    activeSessions.delete(sessionId);
    return true;
  }
  
  return false;
}

/**
 * Revocar todos los dispositivos excepto uno
 */
function revokeOtherDevices(userId, keepSessionId) {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.sessions) return 0;
  
  let count = 0;
  db.sessions.forEach(session => {
    if (session.userId === userId && session.id !== keepSessionId && session.isActive) {
      session.isActive = false;
      session.revokedAt = new Date().toISOString();
      count++;
    }
  });
  
  saveDatabase(db);
  return count;
}

// ==================== VALIDADORES ====================
function validarServicio(datos) {
  const errores = [];
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.push('Nombre del servicio requerido');
  }
  if (!datos.precio || isNaN(parseFloat(datos.precio))) {
    errores.push('Precio debe ser un número válido');
  }
  if (parseFloat(datos.precio) < 0) {
    errores.push('Precio no puede ser negativo');
  }
  if (datos.duracion && isNaN(parseInt(datos.duracion))) {
    errores.push('Duración debe ser un número');
  }
  
  return errores;
}

function validarCliente(datos) {
  const errores = [];
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.push('Nombre del cliente requerido');
  }
  if (datos.email && !datos.email.includes('@')) {
    errores.push('Email inválido');
  }
  
  return errores;
}

// ==================== PASO 15: ROLE-BASED ACCESS CONTROL (RBAC) ====================

/**
 * Obtener todos los roles de un usuario
 */
function getUserRoles(userId, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  const userRoles = db.user_roles?.filter(ur => ur.userId === userId && ur.tenant_id === tenantId) || [];
  return userRoles.map(ur => {
    const role = db.roles?.find(r => r.id === ur.roleId);
    return role;
  }).filter(r => r);
}

/**
 * Obtener permisos de un rol
 */
function getRolePermissions(roleId) {
  loadDatabase();
  const db = getDatabase();
  
  const rolePerms = db.role_permissions?.filter(rp => rp.roleId === roleId) || [];
  return rolePerms.map(rp => {
    const perm = db.permissions?.find(p => p.id === rp.permissionId);
    return perm;
  }).filter(p => p);
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
function hasPermission(userId, permissionName, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  // Admin siempre tiene todos los permisos
  const usuario = db.usuarios?.find(u => u.id === userId);
  if (usuario?.rol === 'administrador') return true;
  
  const roles = getUserRoles(userId, tenantId);
  
  for (const role of roles) {
    const permissions = getRolePermissions(role.id);
    if (permissions.some(p => p.name === permissionName)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verificar si un usuario tiene una acción específica en un recurso
 */
function hasResourceAction(userId, resource, action, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  // Admin siempre tiene acceso
  const usuario = db.usuarios?.find(u => u.id === userId);
  if (usuario?.rol === 'administrador') return true;
  
  const roles = getUserRoles(userId, tenantId);
  
  for (const role of roles) {
    const permissions = getRolePermissions(role.id);
    if (permissions.some(p => p.resource === resource && p.action === action)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Asignar un rol a un usuario
 */
function assignRoleToUser(userId, roleId, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.user_roles) db.user_roles = [];
  
  // Verificar si ya existe
  const exists = db.user_roles.some(ur => ur.userId === userId && ur.roleId === roleId);
  if (exists) return false;
  
  const newUserRole = {
    id: Math.max(...db.user_roles.map(ur => ur.id || 0), 0) + 1,
    userId,
    roleId,
    assignedAt: new Date().toISOString(),
    tenant_id: tenantId
  };
  
  db.user_roles.push(newUserRole);
  saveDatabase(db);
  return true;
}

/**
 * Remover un rol de un usuario
 */
function removeRoleFromUser(userId, roleId, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.user_roles) return false;
  
  const index = db.user_roles.findIndex(ur => 
    ur.userId === userId && ur.roleId === roleId && ur.tenant_id === tenantId
  );
  
  if (index !== -1) {
    db.user_roles.splice(index, 1);
    saveDatabase(db);
    return true;
  }
  
  return false;
}

/**
 * Crear un nuevo rol personalizado
 */
function createCustomRole(name, description, level, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.roles) db.roles = [];
  
  const newRole = {
    id: Math.max(...db.roles.map(r => r.id || 0), 0) + 1,
    name,
    description,
    level,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: false,
    tenant_id: tenantId
  };
  
  db.roles.push(newRole);
  saveDatabase(db);
  return newRole;
}

/**
 * Eliminar un rol personalizado
 */
function deleteCustomRole(roleId, tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.roles) return false;
  
  const role = db.roles.find(r => r.id === roleId && r.tenant_id === tenantId);
  if (!role || role.isSystem) return false;
  
  // Remover asignaciones de roles
  if (db.user_roles) {
    db.user_roles = db.user_roles.filter(ur => ur.roleId !== roleId);
  }
  
  // Remover permisos del rol
  if (db.role_permissions) {
    db.role_permissions = db.role_permissions.filter(rp => rp.roleId !== roleId);
  }
  
  // Remover el rol
  db.roles = db.roles.filter(r => r.id !== roleId);
  saveDatabase(db);
  return true;
}

/**
 * Asignar un permiso a un rol
 */
function assignPermissionToRole(roleId, permissionId) {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.role_permissions) db.role_permissions = [];
  
  // Verificar si ya existe
  const exists = db.role_permissions.some(rp => rp.roleId === roleId && rp.permissionId === permissionId);
  if (exists) return false;
  
  const newRolePerm = {
    id: Math.max(...db.role_permissions.map(rp => rp.id || 0), 0) + 1,
    roleId,
    permissionId,
    createdAt: new Date().toISOString()
  };
  
  db.role_permissions.push(newRolePerm);
  saveDatabase(db);
  return true;
}

/**
 * Remover un permiso de un rol
 */
function removePermissionFromRole(roleId, permissionId) {
  loadDatabase();
  const db = getDatabase();
  
  if (!db.role_permissions) return false;
  
  const index = db.role_permissions.findIndex(rp => 
    rp.roleId === roleId && rp.permissionId === permissionId
  );
  
  if (index !== -1) {
    db.role_permissions.splice(index, 1);
    saveDatabase(db);
    return true;
  }
  
  return false;
}

/**
 * Obtener todas las roles del sistema
 */
function getAllRoles(tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  return db.roles?.filter(r => r.tenant_id === tenantId) || [];
}

/**
 * Obtener todas las permisos del sistema
 */
function getAllPermissions(tenantId = 'demo') {
  loadDatabase();
  const db = getDatabase();
  
  return db.permissions?.filter(p => p.tenant_id === tenantId) || [];
}

// ==================== MIDDLEWARE DE AUTORIZACIÓN ====================

/**
 * Middleware para verificar permisos específicos
 */
function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }
    
    const tenantId = req.user.tenant_id || 'demo';
    if (!hasPermission(req.user.id, permissionName, tenantId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permiso denegado: ' + permissionName 
      });
    }
    
    next();
  };
}

/**
 * Middleware para verificar acción en recurso
 */
function requireResourceAction(resource, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }
    
    const tenantId = req.user.tenant_id || 'demo';
    if (!hasResourceAction(req.user.id, resource, action, tenantId)) {
      return res.status(403).json({ 
        success: false, 
        message: `Permiso denegado: ${action} en ${resource}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware para administradores solo
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado' 
    });
  }
  
  loadDatabase();
  const db = getDatabase();
  const usuario = db.usuarios?.find(u => u.id === req.user.id);
  
  if (usuario?.rol !== 'administrador') {
    return res.status(403).json({ 
      success: false, 
      message: 'Se requieren permisos de administrador' 
    });
  }
  
  next();
}

// ==================== ENDPOINTS GENERALES ====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== AUTENTICACIÓN ====================

/**
 * POST /api/auth/login - Autentica usuario y genera tokens
 * @route POST /api/auth/login
 * @param {string} username - Username o email del usuario
 * @param {string} email - Email del usuario (alternativa a username)
 * @param {string} password - Contraseña en texto plano
 * @returns {Object} {success, token, refreshToken, usuario}
 */
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { username, email, password } = req.body;
    
    // Aceptar login por username o email
    const identificador = email || username;
    
    // ==================== VALIDACIONES ====================
    
    if (!identificador || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario y contraseña requeridos' 
      });
    }

    // Validar formato de identificador (email o username)
    const isEmail = validation.validateEmail(identificador);
    const isUsername = validation.validateUsername(identificador);
    
    if (!isEmail && !isUsername) {
      return res.status(400).json({
        success: false,
        message: 'Identificador inválido (usar email o username válido)'
      });
    }

    // Validar que la contraseña tenga formato básico
    if (typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña inválida'
      });
    }

    // ==================== BÚSQUEDA DE USUARIO ====================
    
    // Buscar usuario en base de datos por email o username
    const usuario = db.usuarios && db.usuarios.find(u => 
      (u.username === identificador || u.email === identificador) && u.activo === 1
    );

    if (!usuario) {
      logger.logAuth(identificador, false, 'Usuario no encontrado');
      return res.status(401).json({
        success: false,
        message: 'El usuario no existe o está inactivo'
      });
    }

    // Validar que el usuario tenga contraseña definida
    if (!usuario.password) {
      logger.logAuth(identificador, false, 'Usuario sin contraseña');
      return res.status(401).json({
        success: false,
        message: 'Error en configuración del usuario'
      });
    }

    // ==================== VALIDACIÓN DE CONTRASEÑA ====================
    
    // Comparar contraseña con hash
    let passwordValida = false;
    try {
      passwordValida = bcrypt.compareSync(password, usuario.password);
    } catch (error) {
      logger.error('Error al comparar contraseña:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en validación de seguridad'
      });
    }

    if (!passwordValida) {
      // PASO 13: Log failed attempt for brute force tracking
      logFailedAttempt(identificador, 'login', req.ip);
      const failedCount = getFailedAttemptCount(identificador, 'login');
      
      logger.logAuth(identificador, false, `Contraseña incorrecta (intento ${failedCount}/5)`);
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // ==================== PASO 14: DEVICE FINGERPRINTING & SESSION MANAGEMENT ====================
    
    // Generar fingerprint del dispositivo
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    // Dispositivo verificado automáticamente - sin bloqueos de verificación
    const deviceCheck = isNewDevice(usuario.id, deviceFingerprint);
    
    // Generar tokens
    const accessToken = jwt.sign(
      {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        permissions: ['*'], // Admin tiene todos los permisos
        type: 'access'
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRY,
        issuer: 'NEURIAX',
        audience: 'neuriax-saas'
      }
    );
    
    // Crear sesión
    const refreshToken = generateRefreshToken(usuario.id, 'temp-session');
    const session = createSession(usuario.id, deviceFingerprint, refreshToken);
    
    // Actualizar último acceso
    usuario.ultimo_acceso = new Date().toISOString();
    if (!usuario.dispositivos) usuario.dispositivos = [];
    usuario.dispositivos.push({
      deviceId: deviceFingerprint.id,
      lastUsed: new Date().toISOString(),
      browser: deviceFingerprint.browser,
      os: deviceFingerprint.os,
      ip: deviceFingerprint.ip
    });
    
    saveDatabase();

    logger.logAuth(identificador, true, `Sesión #${session.id.substring(0, 8)} creada`);

    res.json({
      success: true,
      message: 'Sesión iniciada correctamente',
      accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.id,
      deviceId: deviceFingerprint.id,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol
      }
    });
  } catch (err) {
    logger.error(`Error en login: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
});

// ==================== DEBUG ENDPOINTS (solo en desarrollo) ====================

// Obtener lista de usuarios para testing
app.get('/api/auth/debug/usuarios', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'No permitido en producción' });
  }
  
  try {
    loadDatabase();
    const db = getDatabase();
    const usuarios = (db.usuarios || []).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      nombre_completo: u.nombre_completo,
      rol: u.rol,
      activo: u.activo,
      fecha_creacion: u.fecha_creacion,
      tipo_usuario: u.tipo_usuario
    }));
    
    res.json({
      success: true,
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Crear usuario de test para desarrollo
app.post('/api/auth/debug/create-test-user', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'No permitido en producción' });
  }

  try {
    loadDatabase();
    const db = getDatabase();
    const { email, password, nombre, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    // Verificar si existe
    if (db.usuarios && db.usuarios.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'El email ya existe' });
    }

    const nuevoId = db.usuarios ? Math.max(...db.usuarios.map(u => u.id || 0), 0) + 1 : 1;
    const nuevoUsername = username || email.split('@')[0] + nuevoId;

    const nuevoUsuario = {
      id: nuevoId,
      username: nuevoUsername,
      email: email,
      password: bcrypt.hashSync(password, 12),
      nombre_completo: nombre || 'Test User',
      telefono: '',
      tipo_usuario: 'cliente',
      rol: 'cliente',
      activo: 1,
      verificado: true,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null
    };

    if (!db.usuarios) db.usuarios = [];
    db.usuarios.push(nuevoUsuario);
    saveDatabase();

    logger.logAuth(nuevoUsuario.email, true, 'Usuario de test creado');

    res.status(201).json({
      success: true,
      message: 'Usuario de test creado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        nombre_completo: nuevoUsuario.nombre_completo,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    logger.error(`Error creando usuario de test: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});


// PASO 9: REGISTRO DE NUEVO USUARIO
/**
 * POST /api/auth/register - Registra nuevo usuario
 * @route POST /api/auth/register
 * @param {string} username - Nombre de usuario único (3-20 caracteres)
 * @param {string} email - Email único válido
 * @param {string} password - Contraseña fuerte
 * @param {string} passwordConfirm - Confirmación de contraseña
 * @returns {Object} {success, message, usuario}
 */
app.post('/api/auth/register', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { username, email, password, passwordConfirm, nombre_completo, telefono, tenant_id } = req.body;

    // ==================== VALIDACIONES BÁSICAS ====================
    
    // Validar campos requeridos
    const requiredValidation = validation.validateRequiredFields(
      { username, email, password, passwordConfirm },
      ['username', 'email', 'password', 'passwordConfirm']
    );
    
    if (!requiredValidation.valid) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos: ${requiredValidation.missingFields.join(', ')}`
      });
    }

    // ==================== VALIDACIONES DE EMAIL ====================
    
    if (!validation.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // ==================== VALIDACIONES DE USERNAME ====================
    
    if (!validation.validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username inválido (3-20 caracteres, solo letras, números y guiones bajos)'
      });
    }

    // ==================== VALIDACIONES DE CONTRASEÑA ====================
    
    // Validar que las contraseñas coincidan
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validation.validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña débil: ' + passwordValidation.errors.join(', ')
      });
    }

    // ==================== VALIDACIONES DE UNICIDAD ====================
    
    // Verificar que username sea único
    if (db.usuarios && db.usuarios.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar que email sea único
    if (db.usuarios && db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // ==================== VALIDACIONES OPCIONALES ====================
    
    // Validar teléfono si se proporciona
    if (telefono && !validation.validatePhone(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono inválido'
      });
    }

    // ==================== CREACIÓN DE USUARIO ====================
    
    // Inicializar usuarios si no existe
    if (!db.usuarios) {
      db.usuarios = [];
    }

    // Generar ID único
    const nuevoId = Math.max(...db.usuarios.map(u => u.id || 0), 0) + 1;

    // Hashear contraseña
    const hashedPassword = bcrypt.hashSync(password, 12);

    // Código de verificación
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

    // Sanitizar datos de entrada
    const sanitizedData = validation.sanitizeObject(
      { nombre_completo, telefono },
      ['nombre_completo', 'telefono']
    );

    // Crear nuevo usuario
    const nuevoUsuario = {
      id: nuevoId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      nombre_completo: sanitizedData.nombre_completo || username.trim(),
      telefono: sanitizedData.telefono || '',
      tenant_id: tenant_id || 'demo',
      rol: 'usuario',
      activo: 1,
      verificado: false,
      codigo_verificacion: codigoVerificacion,
      fecha_creacion: new Date().toISOString(),
      ultimo_acceso: null,
      permisos: ['basico']
    };

    // Agregar usuario a la base de datos
    db.usuarios.push(nuevoUsuario);
    saveDatabase();

    // Generar token JWT
    const token = jwt.sign(
      {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    logger.logAuth(username, true, 'Registro exitoso');

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token: token,
      usuario: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        tenant_id: nuevoUsuario.tenant_id,
        rol: nuevoUsuario.rol,
        verificado: false
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

// PASO 10: VERIFICAR EMAIL CON CÓDIGO
app.post('/api/auth/verify-email', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, codigo } = req.body;

    // Validar que email y código estén presentes
    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Email y código de verificación son requeridos'
      });
    }

    // Validar formato de email (contiene @)
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar que código sea 6 dígitos
    if (!/^\d{6}$/.test(codigo)) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación debe ser 6 dígitos'
      });
    }

    // Buscar usuario por email
    const usuario = db.usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que no esté ya verificado
    if (usuario.verificado === true) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya ha sido verificado anteriormente'
      });
    }

    // Verificar que código coincida
    if (usuario.codigo_verificacion !== codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación incorrecto'
      });
    }

    // Marcar como verificado
    usuario.verificado = true;
    usuario.fecha_verificacion = new Date().toISOString();
    delete usuario.codigo_verificacion;
    
    saveDatabase();
    logger.logAuth(email, true, 'Email verificado');

    res.status(200).json({
      success: true,
      message: 'Email verificado correctamente',
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        verificado: true,
        fecha_verificacion: usuario.fecha_verificacion
      }
    });

  } catch (error) {
    console.error('Error en verificación de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar email'
    });
  }
});

// PASO 11: FORGOT PASSWORD - Enviar código de recuperación
app.post('/api/auth/forgot-password', forgotPasswordLimiter, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email } = req.body;

    // Validar que email esté presente
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Validar formato de email
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Buscar usuario por email
    const usuario = db.usuarios.find(u => u.email === email);

    if (!usuario) {
      // Por seguridad, no revelar si el email existe o no
      return res.status(200).json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un código de recuperación',
        send_to: email
      });
    }

    // Generar código de recuperación 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Establecer expiración a 15 minutos
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);

    // Guardar código de reseteo en el usuario
    usuario.password_reset_code = resetCode;
    usuario.password_reset_expiry = expiryTime.toISOString();
    usuario.password_reset_attempts = 0;

    saveDatabase();
    logger.logAuth(email, true, 'Código de recuperación generado');

    // En producción, aquí se enviaría el email con nodemailer
    // Por ahora se retorna el código para pruebas (en producción no se devolvería)
    res.status(200).json({
      success: true,
      message: 'Código de recuperación enviado al email',
      send_to: email,
      // Para DESARROLLO: Aquí está el código (REMOVE en producción)
      _dev_reset_code: process.env.NODE_ENV === 'production' ? undefined : resetCode,
      expiry_minutes: 15
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de recuperación'
    });
  }
});

// PASO 11: VERIFY RESET CODE - Verificar código de recuperación
app.post('/api/auth/verify-reset-code', (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    const usuario = db.usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el código coincida
    if (usuario.password_reset_code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación inválido'
      });
    }

    // Verificar que no haya expirado
    const expiryTime = new Date(usuario.password_reset_expiry);
    if (new Date() > expiryTime) {
      return res.status(400).json({
        success: false,
        message: 'El código ha expirado. Solicita uno nuevo.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Código verificado correctamente'
    });

  } catch (error) {
    console.error('Error en verify-reset-code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el código'
    });
  }
});

// PASO 11: RESET PASSWORD - Validar código y cambiar contraseña
app.put('/api/auth/reset-password', resetPasswordLimiter, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, reset_code, new_password, confirm_password } = req.body;

    // Validar entrada
    if (!email || !reset_code || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Email, código, y contraseña son requeridos'
      });
    }

    // Validar formato email
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar formato código (6 dígitos)
    if (!/^\d{6}$/.test(reset_code)) {
      return res.status(400).json({
        success: false,
        message: 'Código de recuperación debe ser 6 dígitos'
      });
    }

    // Validar que contraseñas coincidan
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    // Validar fortaleza de contraseña (mínimo 6 caracteres)
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario
    const usuario = db.usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que tenga código de reset activo
    if (!usuario.password_reset_code) {
      return res.status(400).json({
        success: false,
        message: 'No hay solicitud de recuperación activa para este usuario'
      });
    }

    // Verificar que código no esté expirado
    const expiryTime = new Date(usuario.password_reset_expiry);
    if (new Date() > expiryTime) {
      // Limpiar código expirado
      delete usuario.password_reset_code;
      delete usuario.password_reset_expiry;
      delete usuario.password_reset_attempts;
      saveDatabase();
      
      return res.status(400).json({
        success: false,
        message: 'El código de recuperación ha expirado. Solicita uno nuevo'
      });
    }

    // Incrementar intentos fallidos
    if (!usuario.password_reset_attempts) {
      usuario.password_reset_attempts = 0;
    }

    // Verificar límite de intentos (máximo 5)
    if (usuario.password_reset_attempts >= 5) {
      delete usuario.password_reset_code;
      delete usuario.password_reset_expiry;
      delete usuario.password_reset_attempts;
      saveDatabase();

      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos fallidos. Solicita un nuevo código de recuperación'
      });
    }

    // Verificar que código sea correcto
    if (usuario.password_reset_code !== reset_code) {
      // PASO 13: Log failed reset attempt for brute force tracking
      logFailedAttempt(email, 'reset-password', req.ip);
      
      usuario.password_reset_attempts++;
      saveDatabase();

      return res.status(400).json({
        success: false,
        message: `Código incorrecto. Intentos restantes: ${5 - usuario.password_reset_attempts}`
      });
    }

    // Validar que nueva contraseña no sea igual a la anterior
    if (bcrypt.compareSync(new_password, usuario.password)) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña no puede ser igual a la anterior'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = bcrypt.hashSync(new_password, 12);

    // Actualizar contraseña y limpiar campos de reset
    usuario.password = hashedPassword;
    usuario.fecha_cambio_password = new Date().toISOString();
    delete usuario.password_reset_code;
    delete usuario.password_reset_expiry;
    delete usuario.password_reset_attempts;

    saveDatabase();
    logger.logAuth(email, true, 'Contraseña restablecida exitosamente');

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida correctamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        fecha_cambio: usuario.fecha_cambio_password
      }
    });

  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña'
    });
  }
});

app.post('/api/auth/logout', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    usuario: req.user
  });
});

// PASO 12: ENABLE 2FA - Generar secret y código QR
app.post('/api/auth/enable-2fa', verifyToken, async (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === req.user.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si ya tiene 2FA habilitado
    if (usuario.two_fa_enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA ya está habilitado para esta cuenta'
      });
    }

    // Generar secret TOTP
    const secret = speakeasy.generateSecret({
      name: `NEURIAX (${usuario.email})`,
      issuer: 'NEURIAX Platform',
      length: 32
    });

    // Generar código QR
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generar códigos de backup (5 códigos de 6 dígitos)
    const backupCodes = [];
    for (let i = 0; i < 5; i++) {
      backupCodes.push(Math.floor(100000 + Math.random() * 900000).toString());
    }

    // Guardar temporalmente en sesión (requiere confirmación)
    usuario.two_fa_temp_secret = secret.base32;
    usuario.two_fa_temp_backup_codes = backupCodes;
    usuario.two_fa_setup_expiry = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutos

    saveDatabase();
    logger.logAuth(usuario.email, true, '2FA setup initiated');

    res.status(200).json({
      success: true,
      message: 'Código QR generado. Escanea con tu aplicación autenticadora',
      qr_code: qrCode,
      secret: secret.base32,
      backup_codes: backupCodes,
      manual_entry: secret.otpauth_url
    });

  } catch (error) {
    console.error('Error en enable 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar 2FA'
    });
  }
});

// PASO 12: VERIFY 2FA - Confirmar 2FA con código TOTP
app.post('/api/auth/verify-2fa-setup', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { totp_code } = req.body;

    if (!totp_code) {
      return res.status(400).json({
        success: false,
        message: 'Código TOTP requerido'
      });
    }

    if (!/^\d{6}$/.test(totp_code)) {
      return res.status(400).json({
        success: false,
        message: 'Código TOTP debe ser 6 dígitos'
      });
    }

    const usuario = db.usuarios.find(u => u.id === req.user.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que hay setup temporal
    if (!usuario.two_fa_temp_secret) {
      return res.status(400).json({
        success: false,
        message: 'No hay setup de 2FA en progreso. Inicia nuevamente'
      });
    }

    // Verificar que no ha expirado
    if (new Date() > new Date(usuario.two_fa_setup_expiry)) {
      delete usuario.two_fa_temp_secret;
      delete usuario.two_fa_temp_backup_codes;
      delete usuario.two_fa_setup_expiry;
      saveDatabase();

      return res.status(400).json({
        success: false,
        message: 'Setup de 2FA expirado. Inicia nuevamente'
      });
    }

    // Verificar código TOTP con ventana de tolerancia (±1 paso de 30 segundos)
    const isValidToken = speakeasy.totp.verify({
      secret: usuario.two_fa_temp_secret,
      encoding: 'base32',
      token: totp_code,
      window: 1
    });

    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Código TOTP incorrecto. Intenta de nuevo'
      });
    }

    // Activar 2FA
    usuario.two_fa_enabled = true;
    usuario.two_fa_secret = usuario.two_fa_temp_secret;
    usuario.two_fa_backup_codes = usuario.two_fa_temp_backup_codes;
    usuario.two_fa_setup_date = new Date().toISOString();

    // Limpiar temporales
    delete usuario.two_fa_temp_secret;
    delete usuario.two_fa_temp_backup_codes;
    delete usuario.two_fa_setup_expiry;

    saveDatabase();
    logger.logAuth(usuario.email, true, '2FA habilitado exitosamente');

    res.status(200).json({
      success: true,
      message: '2FA habilitado correctamente',
      two_fa_enabled: true,
      backup_codes_saved: usuario.two_fa_backup_codes
    });

  } catch (error) {
    console.error('Error en verify 2FA setup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar 2FA'
    });
  }
});

// PASO 12: LOGIN 2FA - Segundo paso de login con 2FA
app.post('/api/auth/login-2fa', login2faLimiter, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { email, totp_code } = req.body;

    if (!email || !totp_code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código TOTP son requeridos'
      });
    }

    if (!/^\d{6}$/.test(totp_code)) {
      return res.status(400).json({
        success: false,
        message: 'Código TOTP debe ser 6 dígitos'
      });
    }

    const usuario = db.usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!usuario.two_fa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario no tiene 2FA habilitado'
      });
    }

    // Verificar código TOTP
    const isValidToken = speakeasy.totp.verify({
      secret: usuario.two_fa_secret,
      encoding: 'base32',
      token: totp_code,
      window: 1
    });

    // Verificar código de backup si falla TOTP
    let isValidBackup = false;
    if (!isValidToken && usuario.two_fa_backup_codes && usuario.two_fa_backup_codes.length > 0) {
      const backupIndex = usuario.two_fa_backup_codes.indexOf(totp_code);
      if (backupIndex !== -1) {
        isValidBackup = true;
        // Eliminar código de backup usado
        usuario.two_fa_backup_codes.splice(backupIndex, 1);
      }
    }

    if (!isValidToken && !isValidBackup) {
      // PASO 13: Log failed 2FA attempt for brute force tracking
      logFailedAttempt(email, '2fa', req.ip);
      
      return res.status(401).json({
        success: false,
        message: 'Código TOTP/Backup incorrecto'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        two_fa_verified: true
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    usuario.ultimo_acceso = new Date().toISOString();
    saveDatabase();
    logger.logAuth(email, true, '2FA verification exitosa');

    res.status(200).json({
      success: true,
      message: '2FA verificado correctamente',
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        two_fa_enabled: true
      }
    });

  } catch (error) {
    console.error('Error en login 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar 2FA'
    });
  }
});

// PASO 12: DISABLE 2FA - Desactivar 2FA
app.post('/api/auth/disable-2fa', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña requerida para desactivar 2FA'
      });
    }

    const usuario = db.usuarios.find(u => u.id === req.user.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña
    const passwordValida = bcrypt.compareSync(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    if (!usuario.two_fa_enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA no está habilitado para esta cuenta'
      });
    }

    // Desactivar 2FA
    usuario.two_fa_enabled = false;
    delete usuario.two_fa_secret;
    delete usuario.two_fa_backup_codes;

    saveDatabase();
    logger.logAuth(usuario.email, true, '2FA deshabilitado');

    res.status(200).json({
      success: true,
      message: '2FA deshabilitado correctamente'
    });

  } catch (error) {
    console.error('Error en disable 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar 2FA'
    });
  }
});

// PASO 12: GET 2FA STATUS - Obtener estado 2FA
app.get('/api/auth/2fa-status', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    const usuario = db.usuarios.find(u => u.id === req.user.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      two_fa_enabled: usuario.two_fa_enabled || false,
      backup_codes_remaining: usuario.two_fa_backup_codes?.length || 0,
      setup_date: usuario.two_fa_setup_date || null
    });

  } catch (error) {
    console.error('Error obteniendo estado 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado 2FA'
    });
  }
});

// ==================== HEALTH CHECK (PASO 57/58) ====================
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: process.env.NODE_ENV === 'production' ? 'postgresql' : 'json',
      status: 'connected'
    }
  });
});

// ==================== SERVICIOS - CRUD PROTEGIDO ====================
app.get('/api/servicios', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    // En modo demo, mostrar servicios sin tenantId O con tenantId='demo'
    const serviciosTenant = (db.servicios || []).filter(s => 
      !s.tenantId || s.tenantId === tenantId || tenantId === 'demo'
    );
    res.json({
      success: true,
      data: serviciosTenant,
      total: serviciosTenant.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/servicios', verifyToken, validateResourceLimit('servicios'), (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const { nombre, categoria, precio, duracion } = req.body;

    // Validar entrada
    const errores = validarServicio({ nombre, precio, duracion });
    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errores
      });
    }

    const nuevoServicio = {
      id: (db.servicios && db.servicios.length > 0) 
        ? Math.max(...db.servicios.map(s => s.id)) + 1 
        : 1,
      tenantId,
      nombre: nombre.trim(),
      categoria: categoria?.trim() || 'General',
      precio: parseFloat(precio),
      duracion: parseInt(duracion) || 30,
      activo: 1,
      fecha_creacion: new Date().toISOString()
    };

    if (!db.servicios) db.servicios = [];
    db.servicios.push(nuevoServicio);
    
    if (saveDatabase()) {
      res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: nuevoServicio
      });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/servicios/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const id = parseInt(req.params.id);
    const { nombre, categoria, precio, duracion } = req.body;

    const index = (db.servicios || []).findIndex(s => s.id === id && s.tenantId === tenantId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    if (nombre) db.servicios[index].nombre = nombre;
    if (categoria) db.servicios[index].categoria = categoria;
    if (precio) db.servicios[index].precio = parseFloat(precio);
    if (duracion) db.servicios[index].duracion = parseInt(duracion);
    db.servicios[index].fecha_actualizacion = new Date().toISOString();

    if (saveDatabase()) {
      res.json({
        success: true,
        message: 'Servicio actualizado',
        data: db.servicios[index]
      });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/servicios/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const id = parseInt(req.params.id);

    const index = (db.servicios || []).findIndex(s => s.id === id && s.tenantId === tenantId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    const eliminado = db.servicios.splice(index, 1);

    if (saveDatabase()) {
      res.json({
        success: true,
        message: 'Servicio eliminado',
        data: eliminado[0]
      });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== CLIENTES ====================
app.get('/api/clientes', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    // En modo demo, mostrar clientes sin tenantId O con tenantId='demo'
    const clientesTenant = (db.clientes || []).filter(c => 
      !c.tenantId || c.tenantId === tenantId || tenantId === 'demo'
    );
    res.json({
      success: true,
      data: clientesTenant,
      total: clientesTenant.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/clientes', verifyToken, validateResourceLimit('clientes'), (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const { nombre, telefono, email } = req.body;

    const errores = validarCliente({ nombre, email });
    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errores
      });
    }

    const nuevoCliente = {
      id: (db.clientes && db.clientes.length > 0)
        ? Math.max(...db.clientes.map(c => c.id)) + 1
        : 1,
      tenantId,
      nombre: nombre.trim(),
      telefono: telefono?.trim() || '',
      email: email?.trim() || '',
      activo: 1,
      fecha_registro: new Date().toISOString()
    };

    if (!db.clientes) db.clientes = [];
    db.clientes.push(nuevoCliente);

    if (saveDatabase()) {
      res.status(201).json({ 
        success: true, 
        message: 'Cliente creado correctamente',
        data: nuevoCliente 
      });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Actualizar cliente
app.put('/api/clientes/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const id = parseInt(req.params.id);
    const idx = (db.clientes || []).findIndex(c => c.id === id && c.tenantId === tenantId);
    
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    db.clientes[idx] = { ...db.clientes[idx], ...req.body, id, tenantId };
    
    if (saveDatabase()) {
      res.json({ success: true, data: db.clientes[idx] });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eliminar cliente
app.delete('/api/clientes/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const id = parseInt(req.params.id);
    const idx = (db.clientes || []).findIndex(c => c.id === id && c.tenantId === tenantId);
    
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    db.clientes.splice(idx, 1);
    
    if (saveDatabase()) {
      res.json({ success: true, message: 'Cliente eliminado' });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== HISTORIAL COMPLETO DE CLIENTE ====================
// GET /api/clientes/:id/historial - Obtiene historial completo del cliente
app.get('/api/clientes/:id/historial', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const clienteId = parseInt(req.params.id);
    
    // Buscar cliente
    const cliente = (db.clientes || []).find(c => c.id === clienteId && c.tenantId === tenantId);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    // Obtener citas del cliente
    const citasCliente = (db.citas || []).filter(c => 
      c.clienteId === clienteId && c.tenantId === tenantId
    ).map(cita => {
      // Enriquecer con datos de empleado y servicios
      const empleado = (db.empleados || []).find(e => e.id === cita.empleadoId);
      const serviciosDetalle = (cita.servicios || []).map(sId => {
        const servicio = (db.servicios || []).find(s => s.id === sId);
        return servicio ? { id: sId, nombre: servicio.nombre, precio: servicio.precio } : { id: sId };
      });
      return {
        ...cita,
        empleado: empleado ? empleado.nombre : null,
        serviciosDetalle,
        tipo: 'cita'
      };
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Obtener ventas/compras del cliente
    const ventasCliente = (db.ventas || []).filter(v => 
      v.clienteId === clienteId && v.tenantId === tenantId
    ).map(venta => ({
      ...venta,
      tipo: 'venta'
    })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Calcular estadísticas
    const totalGastado = ventasCliente.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalCitas = citasCliente.length;
    const citasCompletadas = citasCliente.filter(c => c.estado === 'completada').length;
    const citasCanceladas = citasCliente.filter(c => c.estado === 'cancelada').length;
    const promedioGasto = ventasCliente.length > 0 ? totalGastado / ventasCliente.length : 0;
    
    // Servicios más solicitados
    const serviciosFrecuencia = {};
    citasCliente.forEach(cita => {
      (cita.servicios || []).forEach(sId => {
        serviciosFrecuencia[sId] = (serviciosFrecuencia[sId] || 0) + 1;
      });
    });
    const serviciosFavoritos = Object.entries(serviciosFrecuencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sId, count]) => {
        const servicio = (db.servicios || []).find(s => s.id === parseInt(sId));
        return { id: parseInt(sId), nombre: servicio?.nombre || 'Servicio', count };
      });
    
    // Timeline combinado (citas + ventas)
    const timeline = [...citasCliente, ...ventasCliente]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 50);
    
    // Última visita
    const ultimaVisita = citasCliente.length > 0 ? citasCliente[0].fecha : null;
    
    // Notas del cliente (si existen)
    const notas = cliente.notas || [];
    
    res.json({
      success: true,
      data: {
        cliente,
        estadisticas: {
          totalGastado,
          totalCitas,
          citasCompletadas,
          citasCanceladas,
          promedioGasto,
          diasComoCliente: Math.floor((new Date() - new Date(cliente.fecha_registro)) / (1000 * 60 * 60 * 24)),
          ultimaVisita
        },
        serviciosFavoritos,
        timeline,
        citas: citasCliente,
        ventas: ventasCliente,
        notas
      }
    });
  } catch (err) {
    console.error('Error en historial cliente:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/clientes/:id/notas - Agregar nota al cliente
app.post('/api/clientes/:id/notas', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const clienteId = parseInt(req.params.id);
    const { texto, tipo = 'general' } = req.body;
    
    if (!texto) {
      return res.status(400).json({ success: false, message: 'Texto de nota requerido' });
    }
    
    const idx = (db.clientes || []).findIndex(c => c.id === clienteId && c.tenantId === tenantId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    
    const nuevaNota = {
      id: Date.now(),
      texto,
      tipo,
      fecha: new Date().toISOString(),
      usuarioId: req.user?.id
    };
    
    if (!db.clientes[idx].notas) db.clientes[idx].notas = [];
    db.clientes[idx].notas.push(nuevaNota);
    
    if (saveDatabase()) {
      res.json({ success: true, data: nuevaNota });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard', verifyToken, (req, res) => {
  try {
    loadDatabase();
    
    // Calcular fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    
    // Ventas de hoy
    const ventasHoy = (db.ventas || []).filter(v => {
      if (!v.fecha) return false;
      const fechaVenta = v.fecha.split('T')[0];
      return fechaVenta === hoy;
    });
    
    // Ingresos de hoy
    const ingresosHoy = ventasHoy.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    
    // Ingresos del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];
    
    const ventasMes = (db.ventas || []).filter(v => {
      if (!v.fecha) return false;
      const fechaVenta = v.fecha.split('T')[0];
      return fechaVenta >= inicioMesStr;
    });
    
    const ingresosMes = ventasMes.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    
    // Citas de hoy
    const citasHoy = (db.citas || []).filter(c => {
      if (!c.fecha) return false;
      const fechaCita = c.fecha.split('T')[0];
      return fechaCita === hoy;
    });
    
    // Clientes únicos hoy
    const clientesHoy = [...new Set(ventasHoy.map(v => v.cliente_id))].length;
    
    // Ticket promedio
    const ticketPromedio = ventasHoy.length > 0 ? ingresosHoy / ventasHoy.length : 0;
    
    // Total de ventas (histórico)
    const totalVentasHistorico = (db.ventas || []).reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    
    // Por método de pago hoy
    const efectivoHoy = ventasHoy.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const tarjetaHoy = ventasHoy.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const transferenciaHoy = ventasHoy.filter(v => v.metodo_pago === 'transferencia').reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    
    // Últimas 5 ventas
    const ultimasVentas = (db.ventas || [])
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .map(v => {
        const cliente = (db.clientes || []).find(c => c.id === v.cliente_id);
        return {
          id: v.id,
          fecha: v.fecha,
          cliente: cliente ? cliente.nombre : 'Cliente',
          total: v.total,
          metodo_pago: v.metodo_pago
        };
      });
    
    res.json({
      success: true,
      data: {
        // Estadísticas principales
        totalDia: ingresosHoy,
        ventasHoy: ventasHoy.length,
        clientesHoy,
        citasHoy: citasHoy.length,
        ticketPromedio,
        
        // Mes
        totalMes: ingresosMes,
        ventasMes: ventasMes.length,
        
        // Por método de pago
        efectivoHoy,
        tarjetaHoy,
        transferenciaHoy,
        
        // Totales generales
        total_servicios: (db.servicios || []).length,
        total_clientes: (db.clientes || []).length,
        total_ventas_historico: (db.ventas || []).length,
        ingresos_totales: totalVentasHistorico,
        
        // Últimas ventas
        ultimasVentas
      }
    });
  } catch (err) {
    console.error('Error en dashboard:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PASO 2 - Multi-Tenant SaaS (rutas públicas primero)
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenants/create', tenantsCreateRouter); // PASO 8 - Crear nuevos tenants (sin middleware para permitir registro público)
app.use('/api/plans', plansRouter); // PASO 14 - SaaS Plans & Monetization (ruta pública para ver planes)
app.use('/api/usage', usageRouter); // PASO 15 - Usage statistics & Rate Limiting
app.use('/api/subscriptions', subscriptionsRouter); // Sistema de Suscripciones y Pagos (ruta pública para checkout)

// 🔐 DUAL AUTH SYSTEM - Profesionales vs Clientes
app.use('/api/auth', authRouter);

// Sistema de Reservas Públicas - Marketplace de Salones
const publicRouter = require('./routes/public');
app.use('/api/public', publicRouter); // Rutas públicas sin autenticación

// Sistema de Trial - 7 días gratis
const trialRouter = require('./routes/trial');
app.use('/api/trial', trialRouter); // Registro público con trial

// Aplicar middleware de tenant a todas las rutas protegidas
app.use('/api/ventas', ventasRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/caja', cajaRouter);
app.use('/api/citas', citasRouter);
app.use('/api/salon', salonRouter); // Setup de salón
app.use('/api/notificaciones', notificacionesRouter); // PASO 33 - Notificaciones
app.use('/api/analytics', analyticsRouter); // PASO 34 - Analytics & Business Intelligence
app.use('/api/webhooks', webhooksRouter); // PASO 17 - Webhooks y Eventos

// 🔔 SEMANA 1: Rutas Stripe y Cambio Citas
app.use('/api/stripe', stripeRouter); // SEMANA 1 - Pagos con Stripe
app.use('/api/citas/cambio', cambioCitasRouter); // SEMANA 1 - Cambio de citas online
app.use('/api/public/citas', cambioCitasRouter); // Ruta pública para cambio de citas sin autenticación

// PASO 48 - Sistema de Backup
const backupRouter = require('express').Router();
createBackupRoutes(backupRouter);
app.use('/api', backupRouter);

// PASO 50 - Sistema de Facturación Electrónica
const facturacionRouter = createFacturacionRoutes(verifyToken);
app.use('/api/facturacion', facturacionRouter);

// PASO 51 - Sistema de Conexión Contabilidad
const contabilidadRouter = createContabilidadRoutes(verifyToken);
app.use('/api/contabilidad', contabilidadRouter);

// PASO 52 - Documentación API REST (Swagger/OpenAPI)
createDocsRoutes(app);

// ==================== EMPLEADOS ====================
app.get('/api/empleados', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    // En modo demo, mostrar empleados sin tenantId O con tenantId='demo'
    const empleadosTenant = (db.empleados || []).filter(e => 
      !e.tenantId || e.tenantId === tenantId || tenantId === 'demo'
    );
    res.json({
      success: true,
      data: empleadosTenant
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Crear empleado
app.post('/api/empleados', verifyToken, validateResourceLimit('empleados'), (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const nuevoEmpleado = {
      ...req.body,
      id: Date.now(),
      tenantId,
      activo: true,
      fecha_creacion: new Date().toISOString()
    };
    if (!db.empleados) db.empleados = [];
    db.empleados.push(nuevoEmpleado);
    if (saveDatabase()) {
      res.status(201).json({ success: true, data: nuevoEmpleado });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Actualizar empleado
app.put('/api/empleados/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const id = parseInt(req.params.id);
    const idx = (db.empleados || []).findIndex(e => e.id === id && e.tenantId === tenantId);
    
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }
    
    db.empleados[idx] = { ...db.empleados[idx], ...req.body, id, tenantId };
    
    if (saveDatabase()) {
      res.json({ success: true, data: db.empleados[idx] });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eliminar empleado
app.delete('/api/empleados/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const id = parseInt(req.params.id);
    const idx = (db.empleados || []).findIndex(e => e.id === id && e.tenantId === tenantId);
    
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }
    
    db.empleados.splice(idx, 1);
    
    if (saveDatabase()) {
      res.json({ success: true, message: 'Empleado eliminado' });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== INVENTARIO ====================
app.get('/api/inventario', verifyToken, (req, res) => {
  try {
    loadDatabase();
    // Filtrar productos por tenantId - en modo demo mostrar todos
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const productos = (db.productos || []).filter(p => 
      !p.tenantId || p.tenantId === tenantId || tenantId === 'demo'
    );
    res.json({
      success: true,
      data: productos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Crear producto
app.post('/api/inventario', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user.tenantId || req.headers['x-tenant-id'] || 'demo';
    const productos = db.productos || [];
    const nuevo = {
      ...req.body,
      id: Date.now(),
      tenantId,
      fecha_creacion: new Date().toISOString(),
      activo: true
    };
    productos.push(nuevo);
    db.productos = productos;
    if (saveDatabase()) {
      res.json({ success: true, data: nuevo });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Actualizar producto
app.put('/api/inventario/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user.tenantId || req.headers['x-tenant-id'] || 'demo';
    let productos = db.productos || [];
    const idx = productos.findIndex(p => p.id == req.params.id && p.tenantId === tenantId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    productos[idx] = { ...productos[idx], ...req.body };
    db.productos = productos;
    if (saveDatabase()) {
      res.json({ success: true, data: productos[idx] });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eliminar producto
app.delete('/api/inventario/:id', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user.tenantId || req.headers['x-tenant-id'] || 'demo';
    let productos = db.productos || [];
    const idx = productos.findIndex(p => p.id == req.params.id && p.tenantId === tenantId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    const eliminado = productos.splice(idx, 1)[0];
    db.productos = productos;
    if (saveDatabase()) {
      res.json({ success: true, data: eliminado });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== REPORTES ====================
app.get('/api/reportes', verifyToken, (req, res) => {
  try {
    loadDatabase();
    res.json({
      success: true,
      data: {
        total_ingresos: 0,
        total_gastos: 0,
        total_citas: (db.citas || []).length,
        clientes_activos: (db.clientes || []).filter(c => c.activo).length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== CAJA ====================
app.get('/api/caja', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    const cajasTenant = (db.cajas || []).filter(c => c.tenantId === tenantId);
    res.json({
      success: true,
      data: cajasTenant
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== CONFIGURACIÓN ====================
app.get('/api/configuracion', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    
    // Buscar configuración específica del tenant
    if (!db.configuraciones) db.configuraciones = {};
    const configTenant = db.configuraciones[tenantId] || db.configuracion || {
      nombre_negocio: 'NEURIAX Salon Manager',
      telefono: '',
      email: '',
      direccion: ''
    };
    
    res.json({
      success: true,
      data: configTenant
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/configuracion', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'demo';
    
    // Guardar configuración específica del tenant
    if (!db.configuraciones) db.configuraciones = {};
    db.configuraciones[tenantId] = { ...db.configuraciones[tenantId], ...req.body };

    if (saveDatabase()) {
      res.json({ success: true, data: db.configuraciones[tenantId] });
    } else {
      res.status(500).json({ success: false, message: 'Error guardando' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== PASO 14: SESSION MANAGEMENT & DEVICE FINGERPRINTING ====================

/**
 * GET /api/sessions/devices
 * Listar todos los dispositivos conocidos del usuario
 */
app.get('/api/sessions/devices', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    
    if (!db.knownDevices) {
      return res.json({ success: true, devices: [] });
    }
    
    const userDevices = db.knownDevices.filter(d => d.userId === req.user.id);
    
    const devices = userDevices.map(device => ({
      id: device.id,
      deviceId: device.deviceId,
      browser: device.browser,
      os: device.os,
      ip: device.ip,
      userAgent: device.userAgent,
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
      isTrusted: device.isTrusted,
      trustedAt: device.trustedAt
    }));
    
    res.json({
      success: true,
      totalDevices: devices.length,
      devices: devices.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
    });
  } catch (err) {
    logger.error(`Error listando dispositivos: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/sessions/active
 * Listar todas las sesiones activas del usuario
 */
app.get('/api/sessions/active', verifyToken, (req, res) => {
  try {
    loadDatabase();
    const db = getDatabase();
    
    cleanupExpiredSessions();
    
    if (!db.sessions) {
      return res.json({ success: true, sessions: [] });
    }
    
    const userSessions = db.sessions.filter(s => s.userId === req.user.id && s.isActive);
    
    const sessions = userSessions.map(session => ({
      id: session.id,
      browser: session.browser,
      os: session.os,
      ip: session.ip,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      isCurrent: session.id === req.headers['x-session-id']
    }));
    
    res.json({
      success: true,
      totalSessions: sessions.length,
      sessions: sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    });
  } catch (err) {
    logger.error(`Error listando sesiones: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/sessions/trust-device
 * Marcar dispositivo como de confianza
 */
app.post('/api/sessions/trust-device', verifyToken, (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId requerido'
      });
    }
    
    const success = trustDevice(req.user.id, deviceId);
    
    if (success) {
      logger.logAuth(req.user.email, true, `Dispositivo marcado como confiable`);
      res.json({
        success: true,
        message: 'Dispositivo marcado como de confianza'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Dispositivo no encontrado'
      });
    }
  } catch (err) {
    logger.error(`Error marcando dispositivo: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/sessions/revoke
 * Revocar sesión específica
 */
app.post('/api/sessions/revoke', verifyToken, (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId requerido'
      });
    }
    
    const success = revokeSession(req.user.id, sessionId);
    
    if (success) {
      logger.logAuth(req.user.email, true, `Sesión ${sessionId.substring(0, 8)} revocada`);
      res.json({
        success: true,
        message: 'Sesión revocada correctamente'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }
  } catch (err) {
    logger.error(`Error revocando sesión: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/sessions/revoke-others
 * Revocar todas las demás sesiones
 */
app.post('/api/sessions/revoke-others', verifyToken, (req, res) => {
  try {
    const currentSessionId = req.headers['x-session-id'];
    
    if (!currentSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID no proporcionado'
      });
    }
    
    const count = revokeOtherDevices(req.user.id, currentSessionId);
    
    logger.logAuth(req.user.email, true, `${count} sesiones revocadas`);
    
    res.json({
      success: true,
      message: `${count} sesión(es) revocada(s) correctamente`,
      revokedCount: count
    });
  } catch (err) {
    logger.error(`Error revocando sesiones: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/sessions/refresh-token
 * Rotar refresh token y obtener nuevo access token
 */
app.post('/api/sessions/refresh-token', (req, res) => {
  try {
    const { refreshToken, sessionId } = req.body;
    
    if (!refreshToken || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'refreshToken y sessionId requeridos'
      });
    }
    
    // Validar sesión
    loadDatabase();
    const db = getDatabase();
    
    if (!db.sessions) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida'
      });
    }
    
    const session = db.sessions.find(s => s.id === sessionId && s.isActive);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Sesión no encontrada o inactiva'
      });
    }
    
    // Validar refresh token
    const tokenResult = rotateRefreshToken(refreshToken);
    
    if (!tokenResult.valid) {
      logger.logAuth(`User${session.userId}`, false, `Intento de refresh token inválido`);
      return res.status(401).json({
        success: false,
        message: tokenResult.error
      });
    }
    
    // Generar nuevo access token
    const usuario = db.usuarios.find(u => u.id === session.userId);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const newAccessToken = jwt.sign(
      {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Actualizar última actividad
    updateSessionActivity(sessionId);
    session.lastActivity = new Date().toISOString();
    
    // Guardar cambios
    saveDatabase(db);
    
    logger.logAuth(usuario.email, true, `Token rotado para sesión ${sessionId.substring(0, 8)}`);
    
    res.json({
      success: true,
      message: 'Token renovado correctamente',
      accessToken: newAccessToken,
      refreshToken: tokenResult.token,
      expiresIn: '8h'
    });
  } catch (err) {
    logger.error(`Error en refresh token: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/sessions/current-device
 * Obtener información del dispositivo actual
 */
app.get('/api/sessions/current-device', verifyToken, (req, res) => {
  try {
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    loadDatabase();
    const db = getDatabase();
    
    if (!db.knownDevices) {
      return res.json({ success: true, device: { ...deviceFingerprint, isNew: true, isTrusted: false } });
    }
    
    const knownDevice = db.knownDevices.find(d => 
      d.userId === req.user.id && d.deviceId === deviceFingerprint.id
    );
    
    res.json({
      success: true,
      device: {
        ...deviceFingerprint,
        isNew: !knownDevice,
        isTrusted: knownDevice?.isTrusted || false,
        firstSeenAt: knownDevice?.firstSeenAt,
        lastSeenAt: knownDevice?.lastSeenAt
      }
    });
  } catch (err) {
    logger.error(`Error obteniendo dispositivo actual: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/sessions/revoke-device
 * Revocar todos los accesos desde un dispositivo específico
 */
app.delete('/api/sessions/revoke-device', verifyToken, (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId requerido'
      });
    }
    
    loadDatabase();
    const db = getDatabase();
    
    if (!db.sessions) {
      return res.status(404).json({
        success: false,
        message: 'No hay sesiones para revocar'
      });
    }
    
    let count = 0;
    db.sessions.forEach(session => {
      if (session.userId === req.user.id && session.deviceId === deviceId && session.isActive) {
        session.isActive = false;
        session.revokedAt = new Date().toISOString();
        count++;
      }
    });
    
    saveDatabase(db);
    
    logger.logAuth(req.user.email, true, `${count} sesión(es) del dispositivo ${deviceId.substring(0, 8)} revocada(s)`);
    
    res.json({
      success: true,
      message: `${count} sesión(es) revocada(s)`,
      revokedCount: count
    });
  } catch (err) {
    logger.error(`Error revocando dispositivo: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== PASO 15: ENDPOINTS RBAC ====================

/**
 * GET /api/rbac/roles
 * Obtener todos los roles
 */
app.get('/api/rbac/roles', verifyToken, requireAdmin, (req, res) => {
  try {
    const tenantId = req.user.tenant_id || 'demo';
    const roles = getAllRoles(tenantId);
    
    res.json({
      success: true,
      total: roles.length,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        permissionsCount: getRolePermissions(role.id).length
      }))
    });
  } catch (err) {
    logger.error(`Error obteniendo roles: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/rbac/roles
 * Crear un nuevo rol personalizado
 */
app.post('/api/rbac/roles', verifyToken, requireAdmin, (req, res) => {
  try {
    const { name, description, level } = req.body;
    
    if (!name || !description || level === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, description y level requeridos'
      });
    }
    
    const tenantId = req.user.tenant_id || 'demo';
    const newRole = createCustomRole(name, description, level, tenantId);
    
    logger.info(`✓ Rol creado: ${name}`);
    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      role: newRole
    });
  } catch (err) {
    logger.error(`Error creando rol: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/rbac/roles/:roleId
 * Eliminar un rol personalizado
 */
app.delete('/api/rbac/roles/:roleId', verifyToken, requireAdmin, (req, res) => {
  try {
    const { roleId } = req.params;
    const tenantId = req.user.tenant_id || 'demo';
    
    const deleted = deleteCustomRole(parseInt(roleId), tenantId);
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un rol del sistema'
      });
    }
    
    logger.info(`✓ Rol eliminado: ${roleId}`);
    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });
  } catch (err) {
    logger.error(`Error eliminando rol: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rbac/permissions
 * Obtener todos los permisos
 */
app.get('/api/rbac/permissions', verifyToken, requireAdmin, (req, res) => {
  try {
    const tenantId = req.user.tenant_id || 'demo';
    const permissions = getAllPermissions(tenantId);
    
    res.json({
      success: true,
      total: permissions.length,
      permissions: permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        resource: p.resource,
        action: p.action,
        createdAt: p.createdAt
      }))
    });
  } catch (err) {
    logger.error(`Error obteniendo permisos: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rbac/roles/:roleId/permissions
 * Obtener permisos de un rol
 */
app.get('/api/rbac/roles/:roleId/permissions', verifyToken, requireAdmin, (req, res) => {
  try {
    const { roleId } = req.params;
    const permissions = getRolePermissions(parseInt(roleId));
    
    res.json({
      success: true,
      roleId: parseInt(roleId),
      total: permissions.length,
      permissions: permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        resource: p.resource,
        action: p.action
      }))
    });
  } catch (err) {
    logger.error(`Error obteniendo permisos del rol: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/rbac/roles/:roleId/permissions
 * Asignar un permiso a un rol
 */
app.post('/api/rbac/roles/:roleId/permissions', verifyToken, requireAdmin, (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    
    if (!permissionId) {
      return res.status(400).json({
        success: false,
        message: 'permissionId requerido'
      });
    }
    
    const assigned = assignPermissionToRole(parseInt(roleId), parseInt(permissionId));
    
    if (!assigned) {
      return res.status(400).json({
        success: false,
        message: 'El permiso ya está asignado a este rol'
      });
    }
    
    logger.info(`✓ Permiso ${permissionId} asignado al rol ${roleId}`);
    res.status(201).json({
      success: true,
      message: 'Permiso asignado exitosamente'
    });
  } catch (err) {
    logger.error(`Error asignando permiso: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/rbac/roles/:roleId/permissions/:permissionId
 * Remover un permiso de un rol
 */
app.delete('/api/rbac/roles/:roleId/permissions/:permissionId', verifyToken, requireAdmin, (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    const removed = removePermissionFromRole(parseInt(roleId), parseInt(permissionId));
    
    if (!removed) {
      return res.status(400).json({
        success: false,
        message: 'Permiso no encontrado en este rol'
      });
    }
    
    logger.info(`✓ Permiso ${permissionId} removido del rol ${roleId}`);
    res.json({
      success: true,
      message: 'Permiso removido exitosamente'
    });
  } catch (err) {
    logger.error(`Error removiendo permiso: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/rbac/users/:userId/roles
 * Asignar un rol a un usuario
 */
app.post('/api/rbac/users/:userId/roles', verifyToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'roleId requerido'
      });
    }
    
    const tenantId = req.user.tenant_id || 'demo';
    const assigned = assignRoleToUser(parseInt(userId), parseInt(roleId), tenantId);
    
    if (!assigned) {
      return res.status(400).json({
        success: false,
        message: 'El rol ya está asignado a este usuario'
      });
    }
    
    logger.info(`✓ Rol ${roleId} asignado al usuario ${userId}`);
    res.status(201).json({
      success: true,
      message: 'Rol asignado exitosamente'
    });
  } catch (err) {
    logger.error(`Error asignando rol al usuario: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/rbac/users/:userId/roles/:roleId
 * Remover un rol de un usuario
 */
app.delete('/api/rbac/users/:userId/roles/:roleId', verifyToken, requireAdmin, (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const tenantId = req.user.tenant_id || 'demo';
    
    const removed = removeRoleFromUser(parseInt(userId), parseInt(roleId), tenantId);
    
    if (!removed) {
      return res.status(400).json({
        success: false,
        message: 'Rol no asignado a este usuario'
      });
    }
    
    logger.info(`✓ Rol ${roleId} removido del usuario ${userId}`);
    res.json({
      success: true,
      message: 'Rol removido exitosamente'
    });
  } catch (err) {
    logger.error(`Error removiendo rol del usuario: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rbac/users/:userId/roles
 * Obtener roles de un usuario
 */
app.get('/api/rbac/users/:userId/roles', verifyToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user.tenant_id || 'demo';
    
    const roles = getUserRoles(parseInt(userId), tenantId);
    
    res.json({
      success: true,
      userId: parseInt(userId),
      total: roles.length,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level
      }))
    });
  } catch (err) {
    logger.error(`Error obteniendo roles del usuario: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rbac/users/:userId/permissions
 * Obtener todos los permisos de un usuario
 */
app.get('/api/rbac/users/:userId/permissions', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    
    // El usuario solo puede ver sus propios permisos, admins pueden ver todos
    if (req.user.id !== parseInt(userId) && req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los permisos de otro usuario'
      });
    }
    
    const tenantId = req.user.tenant_id || 'demo';
    const roles = getUserRoles(parseInt(userId), tenantId);
    
    const allPermissions = [];
    const permissionIds = new Set();
    
    roles.forEach(role => {
      const rolePerms = getRolePermissions(role.id);
      rolePerms.forEach(perm => {
        if (!permissionIds.has(perm.id)) {
          permissionIds.add(perm.id);
          allPermissions.push({
            id: perm.id,
            name: perm.name,
            resource: perm.resource,
            action: perm.action
          });
        }
      });
    });
    
    res.json({
      success: true,
      userId: parseInt(userId),
      total: allPermissions.length,
      permissions: allPermissions
    });
  } catch (err) {
    logger.error(`Error obteniendo permisos del usuario: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rbac/check/:permissionName
 * Verificar si el usuario actual tiene un permiso
 */
app.get('/api/rbac/check/:permissionName', verifyToken, (req, res) => {
  try {
    const { permissionName } = req.params;
    const tenantId = req.user.tenant_id || 'demo';
    
    const has = hasPermission(req.user.id, permissionName, tenantId);
    
    res.json({
      success: true,
      userId: req.user.id,
      permission: permissionName,
      hasPermission: has
    });
  } catch (err) {
    logger.error(`Error verificando permiso: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/rbac/audit
 * Obtener logs de auditoría de RBAC
 * PASO 10: Audit Log
 */
app.get('/api/rbac/audit', verifyToken, requireAdmin, (req, res) => {
  try {
    const { type = 'all', range = '7d' } = req.query;
    const tenantId = req.user.tenant_id || 'demo';
    
    loadDatabase();
    const db = getDatabase();
    
    // Obtener logs de auditoría
    let logs = db.audit_logs || [];
    
    // Filtrar por tenant
    logs = logs.filter(log => log.tenant_id === tenantId);
    
    // Filtrar por tipo
    if (type !== 'all') {
      const typeFilters = {
        'roles': ['ROLE_CREATED', 'ROLE_DELETED', 'ROLE_UPDATED'],
        'permissions': ['PERMISSION_ASSIGNED', 'PERMISSION_REVOKED'],
        'users': ['USER_ROLE_CHANGED'],
        'access': ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCESS_DENIED']
      };
      if (typeFilters[type]) {
        logs = logs.filter(log => typeFilters[type].includes(log.type));
      }
    }
    
    // Filtrar por rango de fechas
    const now = new Date();
    const ranges = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      'all': 365 * 10
    };
    const daysAgo = ranges[range] || 7;
    const cutoffDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    logs = logs.filter(log => new Date(log.createdAt) >= cutoffDate);
    
    // Ordenar por fecha descendente
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Limitar a 100 registros
    logs = logs.slice(0, 100);
    
    res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (err) {
    logger.error(`Error obteniendo audit logs: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/rbac/audit
 * Registrar un evento de auditoría
 */
app.post('/api/rbac/audit', verifyToken, (req, res) => {
  try {
    const { type, action, details, resourceId, resourceType } = req.body;
    const tenantId = req.user.tenant_id || 'demo';
    
    loadDatabase();
    const db = getDatabase();
    
    if (!db.audit_logs) db.audit_logs = [];
    
    const newLog = {
      id: db.audit_logs.length + 1,
      type,
      action,
      details,
      resourceId,
      resourceType,
      userId: req.user.id,
      userName: req.user.nombre_completo || req.user.username,
      tenant_id: tenantId,
      createdAt: new Date().toISOString(),
      ip: req.ip || req.connection?.remoteAddress
    };
    
    db.audit_logs.push(newLog);
    saveDatabase(db);
    
    res.json({ success: true, log: newLog });
  } catch (err) {
    logger.error(`Error creando audit log: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== MANEJO DE ERRORES ====================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// ==================== INICIAR SERVIDOR ====================
const server = app.listen(PORT, () => {
  console.log('\n✅ Base de datos inicializada correctamente');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`💈 NEURIAX SaaS Platform - Sistema Operativo`);
  console.log(`📡 API lista para recibir peticiones desde http://localhost:3000\n`);
  console.log('📊 Endpoints disponibles:');
  console.log('   GET  /api/servicios');
  console.log('   POST /api/servicios');
  console.log('   PUT  /api/servicios/:id');
  console.log('   DELETE /api/servicios/:id');
  console.log('   GET  /api/clientes');
  console.log('   POST /api/clientes');
  console.log('   GET  /api/dashboard');
  console.log('\n📖 Documentación API:');
  console.log(`   📗 Swagger UI:  http://localhost:${PORT}/api/docs`);
  console.log(`   📘 ReDoc:       http://localhost:${PORT}/api/redoc`);
  console.log(`   📄 OpenAPI JSON: http://localhost:${PORT}/api/docs/json\n`);
  
  // 🔔 SISTEMA DE RECORDATORIOS AUTOMÁTICOS (SEMANA 1)
  try {
    const { startReminderScheduler } = require('./schedulers/reminderScheduler');
    startReminderScheduler();
  } catch (err) {
    console.warn('⚠️ Scheduler de recordatorios no inicializado:', err.message);
  }

  // Iniciar sistema de informes automáticos
  try {
    const informesAutomaticos = require('./services/informesAutomaticos');
    if (informesAutomaticos.iniciarProgramador) {
      informesAutomaticos.iniciarProgramador();
      console.log('📧 Sistema de informes automáticos ACTIVO');
    }
  } catch (err) {
    console.log('⚠️ Informes automáticos no configurados:', err.message);
  }
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('❌ Error del servidor:', err.message);
});

// Permitir que Node no se cierre
process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rechazo no manejado:', reason);
});
