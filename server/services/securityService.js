/**
 * NEURIAX SaaS Platform - Servicio de Seguridad Avanzada
 * PASO 9: Autenticación Reforzada
 * 
 * Features:
 * - Bloqueo por intentos fallidos (exponential backoff)
 * - Remember Me con tokens seguros (30 días)
 * - Detección de sesiones activas
 * - Sistema 2FA preparado (TOTP)
 * - Rate limiting inteligente
 * - Encriptación AES-256-GCM para datos sensibles
 * - Hashing bcrypt con cost 12
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ==========================================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================================
const SECURITY_CONFIG = {
  // Bloqueo por intentos fallidos
  maxLoginAttempts: 5,
  lockoutDurations: [1, 5, 15, 60, 1440], // minutos (1m, 5m, 15m, 1h, 24h)
  attemptWindowMinutes: 15,
  
  // Remember Me
  rememberMeDays: 30,
  normalSessionDays: 7,
  
  // 2FA
  twoFactorEnabled: false, // Preparado pero desactivado
  twoFactorIssuer: 'NEURIAX',
  twoFactorWindow: 1, // Ventana de verificación TOTP
  
  // Rate Limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
  rateLimitMaxRequests: 100, // requests por ventana
  
  // Tokens
  rememberMeTokenLength: 64,
  secureTokenLength: 32,
  
  // Hashing
  bcryptRounds: 12, // Aumentado de 10 a 12 para mayor seguridad
  
  // Encriptación AES-256
  encryptionAlgorithm: 'aes-256-gcm',
  ivLength: 16,
  tagLength: 16
};

// Clave de encriptación (usar variable de entorno en producción)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'NEURIAX_AES256_KEY_2026_SecureProduction!';

// ==========================================================
// FUNCIONES DE ENCRIPTACIÓN AES-256-GCM
// ==========================================================

/**
 * Encriptar datos sensibles (email, teléfono, dirección)
 * @param {string} text - Texto a encriptar
 * @returns {string} - Texto encriptado en formato base64
 */
const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(SECURITY_CONFIG.ivLength);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'neuriax-salt-2026', 32);
    const cipher = crypto.createCipheriv(SECURITY_CONFIG.encryptionAlgorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const result = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
    
    return result.toString('base64');
  } catch (error) {
    console.error('[Security] Encryption error:', error.message);
    return text;
  }
};

/**
 * Desencriptar datos
 * @param {string} encryptedText - Texto encriptado en base64
 * @returns {string} - Texto desencriptado
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  try {
    const buffer = Buffer.from(encryptedText, 'base64');
    const iv = buffer.subarray(0, SECURITY_CONFIG.ivLength);
    const tag = buffer.subarray(SECURITY_CONFIG.ivLength, SECURITY_CONFIG.ivLength + SECURITY_CONFIG.tagLength);
    const encrypted = buffer.subarray(SECURITY_CONFIG.ivLength + SECURITY_CONFIG.tagLength);
    
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'neuriax-salt-2026', 32);
    const decipher = crypto.createDecipheriv(SECURITY_CONFIG.encryptionAlgorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    return encryptedText; // No está encriptado o error
  }
};

// ==========================================================
// FUNCIONES DE HASHING DE CONTRASEÑAS
// ==========================================================

/**
 * Hash de contraseña con bcrypt (cost 12)
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SECURITY_CONFIG.bcryptRounds);
};

const hashPasswordSync = (password) => {
  return bcrypt.hashSync(password, SECURITY_CONFIG.bcryptRounds);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const verifyPasswordSync = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

// ==========================================================
// FUNCIONES DE VALIDACIÓN Y SANITIZACIÓN
// ==========================================================

/**
 * Sanitizar string para prevenir XSS
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validar email
 */
const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Validar contraseña fuerte
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Requiere una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Requiere una minúscula');
  if (!/[0-9]/.test(password)) errors.push('Requiere un número');
  return { valid: errors.length === 0, errors };
};

/**
 * Enmascarar email: ejemplo@mail.com -> e***o@mail.com
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

/**
 * Enmascarar teléfono: 612345678 -> 612***678
 */
const maskPhone = (phone) => {
  if (!phone || phone.length < 6) return phone;
  const clean = phone.replace(/\s/g, '');
  return clean.slice(0, 3) + '***' + clean.slice(-3);
};

/**
 * Generar token seguro
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generar código de verificación numérico
 */
const generateVerificationCode = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return crypto.randomInt(min, max).toString();
};

/**
 * SHA-256 hash
 */
const sha256 = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// ==========================================================
// ALMACENAMIENTO EN MEMORIA (Redis en producción)
// ==========================================================
const loginAttempts = new Map(); // userId/ip -> { attempts, lastAttempt, lockedUntil }
const rememberMeTokens = new Map(); // token -> { userId, createdAt, expiresAt, deviceInfo }
const twoFactorSecrets = new Map(); // userId -> { secret, enabled, backupCodes }
const rateLimitStore = new Map(); // ip -> { count, windowStart }

// Archivo de persistencia
const SECURITY_DATA_FILE = path.join(__dirname, '../database/security_data.json');

// ==========================================================
// PERSISTENCIA
// ==========================================================
const loadSecurityData = () => {
  try {
    if (fs.existsSync(SECURITY_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(SECURITY_DATA_FILE, 'utf8'));
      
      // Restaurar login attempts
      if (data.loginAttempts) {
        Object.entries(data.loginAttempts).forEach(([key, value]) => {
          loginAttempts.set(key, value);
        });
      }
      
      // Restaurar remember me tokens
      if (data.rememberMeTokens) {
        Object.entries(data.rememberMeTokens).forEach(([key, value]) => {
          rememberMeTokens.set(key, value);
        });
      }
      
      // Restaurar 2FA secrets
      if (data.twoFactorSecrets) {
        Object.entries(data.twoFactorSecrets).forEach(([key, value]) => {
          twoFactorSecrets.set(parseInt(key), value);
        });
      }
    }
  } catch (error) {
    console.error('Error loading security data:', error.message);
  }
};

const saveSecurityData = () => {
  try {
    const data = {
      loginAttempts: Object.fromEntries(loginAttempts),
      rememberMeTokens: Object.fromEntries(rememberMeTokens),
      twoFactorSecrets: Object.fromEntries(twoFactorSecrets),
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(SECURITY_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving security data:', error.message);
  }
};

// Inicializar
loadSecurityData();

// Guardar cada 5 minutos
setInterval(saveSecurityData, 5 * 60 * 1000);

// ==========================================================
// BLOQUEO POR INTENTOS FALLIDOS
// ==========================================================

/**
 * Registrar intento de login fallido
 */
const recordFailedLogin = (identifier) => {
  const key = identifier.toString();
  const now = Date.now();
  const windowMs = SECURITY_CONFIG.attemptWindowMinutes * 60 * 1000;
  
  let record = loginAttempts.get(key) || {
    attempts: 0,
    lastAttempt: now,
    lockedUntil: null,
    lockoutCount: 0
  };
  
  // Si pasó la ventana de tiempo, resetear intentos
  if (now - record.lastAttempt > windowMs) {
    record.attempts = 0;
  }
  
  record.attempts++;
  record.lastAttempt = now;
  
  // Si excede el máximo, bloquear
  if (record.attempts >= SECURITY_CONFIG.maxLoginAttempts) {
    const lockoutIndex = Math.min(record.lockoutCount, SECURITY_CONFIG.lockoutDurations.length - 1);
    const lockoutMinutes = SECURITY_CONFIG.lockoutDurations[lockoutIndex];
    record.lockedUntil = now + (lockoutMinutes * 60 * 1000);
    record.lockoutCount++;
    record.attempts = 0; // Reset para después del bloqueo
    
    loginAttempts.set(key, record);
    saveSecurityData();
    
    return {
      locked: true,
      lockedUntil: new Date(record.lockedUntil),
      lockoutMinutes,
      message: `Cuenta bloqueada por ${lockoutMinutes} minutos debido a múltiples intentos fallidos`
    };
  }
  
  loginAttempts.set(key, record);
  saveSecurityData();
  
  const remainingAttempts = SECURITY_CONFIG.maxLoginAttempts - record.attempts;
  return {
    locked: false,
    remainingAttempts,
    message: `Intento fallido. ${remainingAttempts} intentos restantes`
  };
};

/**
 * Verificar si una cuenta está bloqueada
 */
const isAccountLocked = (identifier) => {
  const key = identifier.toString();
  const record = loginAttempts.get(key);
  
  if (!record || !record.lockedUntil) {
    return { locked: false };
  }
  
  const now = Date.now();
  if (now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    return {
      locked: true,
      lockedUntil: new Date(record.lockedUntil),
      remainingMinutes,
      message: `Cuenta bloqueada. Intenta de nuevo en ${remainingMinutes} minuto(s)`
    };
  }
  
  // El bloqueo expiró
  return { locked: false };
};

/**
 * Limpiar intentos fallidos (después de login exitoso)
 */
const clearFailedAttempts = (identifier) => {
  const key = identifier.toString();
  const record = loginAttempts.get(key);
  
  if (record) {
    record.attempts = 0;
    record.lockedUntil = null;
    // NO resetear lockoutCount para mantener historial de bloqueos
    loginAttempts.set(key, record);
    saveSecurityData();
  }
};

/**
 * Obtener estadísticas de intentos
 */
const getLoginAttemptStats = (identifier) => {
  const key = identifier.toString();
  const record = loginAttempts.get(key);
  
  if (!record) {
    return {
      attempts: 0,
      maxAttempts: SECURITY_CONFIG.maxLoginAttempts,
      lockoutCount: 0,
      lastAttempt: null
    };
  }
  
  return {
    attempts: record.attempts,
    maxAttempts: SECURITY_CONFIG.maxLoginAttempts,
    lockoutCount: record.lockoutCount,
    lastAttempt: record.lastAttempt ? new Date(record.lastAttempt) : null,
    lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : null
  };
};

// ==========================================================
// REMEMBER ME - TOKEN SEGURO
// ==========================================================

/**
 * Generar token Remember Me
 */
const generateRememberMeToken = (userId, deviceInfo = {}) => {
  const token = crypto.randomBytes(SECURITY_CONFIG.rememberMeTokenLength).toString('hex');
  const now = Date.now();
  const expiresAt = now + (SECURITY_CONFIG.rememberMeDays * 24 * 60 * 60 * 1000);
  
  const tokenData = {
    userId,
    token,
    createdAt: now,
    expiresAt,
    deviceInfo: {
      userAgent: deviceInfo.userAgent || 'Unknown',
      ip: deviceInfo.ip || 'Unknown',
      browser: parseBrowser(deviceInfo.userAgent),
      os: parseOS(deviceInfo.userAgent),
      createdAtFormatted: new Date(now).toISOString()
    },
    lastUsed: now
  };
  
  rememberMeTokens.set(token, tokenData);
  saveSecurityData();
  
  return {
    token,
    expiresAt: new Date(expiresAt),
    expiresInDays: SECURITY_CONFIG.rememberMeDays
  };
};

/**
 * Verificar token Remember Me
 */
const verifyRememberMeToken = (token) => {
  const tokenData = rememberMeTokens.get(token);
  
  if (!tokenData) {
    return { valid: false, error: 'Token no encontrado' };
  }
  
  const now = Date.now();
  if (now > tokenData.expiresAt) {
    rememberMeTokens.delete(token);
    saveSecurityData();
    return { valid: false, error: 'Token expirado' };
  }
  
  // Actualizar último uso
  tokenData.lastUsed = now;
  rememberMeTokens.set(token, tokenData);
  
  return {
    valid: true,
    userId: tokenData.userId,
    deviceInfo: tokenData.deviceInfo,
    createdAt: new Date(tokenData.createdAt),
    expiresAt: new Date(tokenData.expiresAt)
  };
};

/**
 * Revocar token Remember Me
 */
const revokeRememberMeToken = (token) => {
  const existed = rememberMeTokens.has(token);
  rememberMeTokens.delete(token);
  saveSecurityData();
  return { success: existed };
};

/**
 * Revocar todos los tokens Remember Me de un usuario
 */
const revokeAllRememberMeTokens = (userId) => {
  let count = 0;
  for (const [token, data] of rememberMeTokens) {
    if (data.userId === userId) {
      rememberMeTokens.delete(token);
      count++;
    }
  }
  saveSecurityData();
  return { success: true, revokedCount: count };
};

/**
 * Obtener todos los tokens Remember Me activos de un usuario
 */
const getUserRememberMeTokens = (userId) => {
  const tokens = [];
  const now = Date.now();
  
  for (const [token, data] of rememberMeTokens) {
    if (data.userId === userId && now < data.expiresAt) {
      tokens.push({
        tokenId: token.substring(0, 8) + '...', // Solo mostrar inicio
        deviceInfo: data.deviceInfo,
        createdAt: new Date(data.createdAt),
        expiresAt: new Date(data.expiresAt),
        lastUsed: new Date(data.lastUsed)
      });
    }
  }
  
  return tokens;
};

// ==========================================================
// 2FA - TWO FACTOR AUTHENTICATION (PREPARADO)
// ==========================================================

/**
 * Generar secreto 2FA para un usuario
 */
const generate2FASecret = (userId, userEmail) => {
  // Base32 encoding para TOTP
  const secret = crypto.randomBytes(20).toString('hex');
  const base32Secret = base32Encode(Buffer.from(secret, 'hex'));
  
  // Generar códigos de respaldo
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  
  const secretData = {
    secret: base32Secret,
    enabled: false,
    backupCodes: backupCodes.map(code => ({ code, used: false })),
    createdAt: new Date().toISOString()
  };
  
  twoFactorSecrets.set(userId, secretData);
  saveSecurityData();
  
  // Generar URL para QR (otpauth://)
  const otpauthUrl = `otpauth://totp/${SECURITY_CONFIG.twoFactorIssuer}:${encodeURIComponent(userEmail)}?secret=${base32Secret}&issuer=${SECURITY_CONFIG.twoFactorIssuer}`;
  
  return {
    secret: base32Secret,
    otpauthUrl,
    backupCodes,
    qrCodeData: otpauthUrl // Para generar QR en frontend
  };
};

/**
 * Verificar código TOTP
 */
const verify2FACode = (userId, code) => {
  const secretData = twoFactorSecrets.get(userId);
  
  if (!secretData) {
    return { valid: false, error: '2FA no configurado' };
  }
  
  // Verificar código de respaldo primero
  const backupCode = secretData.backupCodes.find(bc => bc.code === code && !bc.used);
  if (backupCode) {
    backupCode.used = true;
    twoFactorSecrets.set(userId, secretData);
    saveSecurityData();
    return { valid: true, usedBackupCode: true };
  }
  
  // Verificar TOTP
  const isValid = verifyTOTP(secretData.secret, code);
  
  return { valid: isValid, usedBackupCode: false };
};

/**
 * Habilitar 2FA para un usuario (después de verificar código)
 */
const enable2FA = (userId, code) => {
  const secretData = twoFactorSecrets.get(userId);
  
  if (!secretData) {
    return { success: false, error: '2FA no configurado' };
  }
  
  // Verificar que el código es válido
  const isValid = verifyTOTP(secretData.secret, code);
  
  if (!isValid) {
    return { success: false, error: 'Código inválido' };
  }
  
  secretData.enabled = true;
  secretData.enabledAt = new Date().toISOString();
  twoFactorSecrets.set(userId, secretData);
  saveSecurityData();
  
  return { success: true, message: '2FA habilitado correctamente' };
};

/**
 * Deshabilitar 2FA
 */
const disable2FA = (userId, password) => {
  // En producción, verificar contraseña antes de deshabilitar
  twoFactorSecrets.delete(userId);
  saveSecurityData();
  return { success: true, message: '2FA deshabilitado' };
};

/**
 * Verificar si un usuario tiene 2FA habilitado
 */
const is2FAEnabled = (userId) => {
  const secretData = twoFactorSecrets.get(userId);
  return secretData?.enabled || false;
};

/**
 * Obtener códigos de respaldo restantes
 */
const getRemainingBackupCodes = (userId) => {
  const secretData = twoFactorSecrets.get(userId);
  if (!secretData) return 0;
  return secretData.backupCodes.filter(bc => !bc.used).length;
};

// ==========================================================
// RATE LIMITING
// ==========================================================

/**
 * Verificar rate limit
 */
const checkRateLimit = (ip) => {
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  
  if (!record || now - record.windowStart > SECURITY_CONFIG.rateLimitWindowMs) {
    record = { count: 0, windowStart: now };
  }
  
  record.count++;
  rateLimitStore.set(ip, record);
  
  const remaining = Math.max(0, SECURITY_CONFIG.rateLimitMaxRequests - record.count);
  const resetTime = record.windowStart + SECURITY_CONFIG.rateLimitWindowMs;
  
  return {
    allowed: record.count <= SECURITY_CONFIG.rateLimitMaxRequests,
    remaining,
    resetTime: new Date(resetTime),
    retryAfter: Math.ceil((resetTime - now) / 1000)
  };
};

// ==========================================================
// UTILIDADES
// ==========================================================

// Parsear browser del user agent
const parseBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Parsear OS del user agent
const parseOS = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown';
};

// Codificación Base32 para TOTP
const base32Encode = (buffer) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let base32 = '';
  
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    if (chunk.length < 5) break;
    base32 += alphabet[parseInt(chunk, 2)];
  }
  
  return base32;
};

// Verificación TOTP simple (en producción usar librería speakeasy)
const verifyTOTP = (secret, token) => {
  // Implementación simplificada - usar speakeasy en producción
  try {
    const time = Math.floor(Date.now() / 30000);
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    
    // Verificar ventana de tiempo
    for (let i = -SECURITY_CONFIG.twoFactorWindow; i <= SECURITY_CONFIG.twoFactorWindow; i++) {
      const counter = Buffer.alloc(8);
      counter.writeBigInt64BE(BigInt(time + i));
      
      const digest = hmac.update(counter).digest();
      const offset = digest[digest.length - 1] & 0xf;
      const code = ((digest[offset] & 0x7f) << 24 |
                   (digest[offset + 1] & 0xff) << 16 |
                   (digest[offset + 2] & 0xff) << 8 |
                   (digest[offset + 3] & 0xff)) % 1000000;
      
      if (code.toString().padStart(6, '0') === token) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verificando TOTP:', error);
    return false;
  }
};

// ==========================================================
// LIMPIEZA PERIÓDICA
// ==========================================================

const cleanupExpiredData = () => {
  const now = Date.now();
  let cleaned = 0;
  
  // Limpiar tokens Remember Me expirados
  for (const [token, data] of rememberMeTokens) {
    if (now > data.expiresAt) {
      rememberMeTokens.delete(token);
      cleaned++;
    }
  }
  
  // Limpiar intentos de login antiguos (más de 24 horas)
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  for (const [key, record] of loginAttempts) {
    if (record.lastAttempt < oneDayAgo && !record.lockedUntil) {
      loginAttempts.delete(key);
      cleaned++;
    }
  }
  
  // Limpiar rate limit store
  for (const [ip, record] of rateLimitStore) {
    if (now - record.windowStart > SECURITY_CONFIG.rateLimitWindowMs) {
      rateLimitStore.delete(ip);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    saveSecurityData();
    console.log(`[Security] Limpieza: ${cleaned} registros eliminados`);
  }
};

// Ejecutar limpieza cada hora
setInterval(cleanupExpiredData, 60 * 60 * 1000);

// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
  // Configuración
  SECURITY_CONFIG,
  
  // Encriptación AES-256
  encrypt,
  decrypt,
  
  // Hashing de contraseñas (bcrypt)
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
  
  // Validación y sanitización
  sanitizeString,
  isValidEmail,
  validatePasswordStrength,
  maskEmail,
  maskPhone,
  generateSecureToken,
  generateVerificationCode,
  sha256,
  
  // Bloqueo por intentos fallidos
  recordFailedLogin,
  isAccountLocked,
  clearFailedAttempts,
  getLoginAttemptStats,
  
  // Remember Me
  generateRememberMeToken,
  verifyRememberMeToken,
  revokeRememberMeToken,
  revokeAllRememberMeTokens,
  getUserRememberMeTokens,
  
  // 2FA
  generate2FASecret,
  verify2FACode,
  enable2FA,
  disable2FA,
  is2FAEnabled,
  getRemainingBackupCodes,
  
  // Rate Limiting
  checkRateLimit,
  
  // Utilidades
  parseBrowser,
  parseOS,
  
  // Limpieza
  cleanupExpiredData
};
