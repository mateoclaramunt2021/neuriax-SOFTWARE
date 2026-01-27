/**
 * NEURIAX SaaS Platform - Middleware de Validación y Sanitización
 * 
 * Protección contra:
 * - XSS (Cross-Site Scripting)
 * - Inyección SQL
 * - Inyección NoSQL
 * - Datos malformados
 */

const securityService = require('../services/securityService');

// ==========================================================
// SANITIZACIÓN DE DATOS
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
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Sanitizar objeto recursivamente
 */
const sanitizeObject = (obj, fieldsToSanitize = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in sanitized) {
    if (fieldsToSanitize.length === 0 || fieldsToSanitize.includes(key)) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitizeString(sanitized[key]);
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeObject(sanitized[key], fieldsToSanitize);
      }
    }
  }
  
  return sanitized;
};

// ==========================================================
// VALIDACIONES
// ==========================================================

/**
 * Validar email
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validar teléfono
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return true; // Opcional
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validar username
 */
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Validar contraseña fuerte
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Contraseña es requerida'] };
  }
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  
  if (password.length > 128) {
    errors.push('Máximo 128 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Requiere al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Requiere al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Requiere al menos un número');
  }
  
  // Lista de contraseñas comunes prohibidas
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password1', 'admin123', 'letmein', 'welcome', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Contraseña demasiado común');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calcular fuerza de contraseña (0-100)
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Longitud
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Caracteres
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  
  return Math.min(100, score);
};

/**
 * Detectar inyección SQL/NoSQL
 */
const detectInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  // Patrones de inyección SQL
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--)|(;)|(\/\*)/,
    /(\bOR\b|\bAND\b)\s*(\d+\s*=\s*\d+|['"]\s*=\s*['"]])/i,
    /(EXEC|EXECUTE)\s*\(/i
  ];
  
  // Patrones de inyección NoSQL
  const noSqlPatterns = [
    /\$where/i,
    /\$gt|\$lt|\$gte|\$lte|\$ne|\$eq|\$regex/i,
    /\$or|\$and|\$not|\$nor/i
  ];
  
  for (const pattern of [...sqlPatterns, ...noSqlPatterns]) {
    if (pattern.test(value)) return true;
  }
  
  return false;
};

// ==========================================================
// MIDDLEWARES
// ==========================================================

/**
 * Middleware de sanitización de body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware de detección de inyección
 */
const preventInjection = (req, res, next) => {
  const checkValue = (value, path) => {
    if (typeof value === 'string' && detectInjection(value)) {
      console.warn(`[SECURITY] Posible inyección detectada en ${path}:`, value.substring(0, 50));
      return true;
    }
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (checkValue(value[key], `${path}.${key}`)) return true;
      }
    }
    return false;
  };
  
  if (checkValue(req.body, 'body') || checkValue(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      message: 'Entrada inválida detectada'
    });
  }
  
  next();
};

/**
 * Middleware de validación de registro
 */
const validateRegistration = (req, res, next) => {
  const { email, password, username } = req.body;
  const errors = [];
  
  if (!email || !isValidEmail(email)) {
    errors.push('Email inválido');
  }
  
  if (username && !isValidUsername(username)) {
    errors.push('Username inválido (3-30 caracteres, solo letras, números, guiones y guión bajo)');
  }
  
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    errors.push(...passwordValidation.errors);
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validación fallida',
      errors
    });
  }
  
  next();
};

/**
 * Middleware de validación de login
 */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos'
    });
  }
  
  // Limitar longitud para prevenir DoS
  if (username.length > 100 || password.length > 128) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada demasiado largos'
    });
  }
  
  next();
};

// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
  // Funciones de sanitización
  sanitizeString,
  sanitizeObject,
  
  // Funciones de validación
  isValidEmail,
  isValidPhone,
  isValidUsername,
  validatePasswordStrength,
  calculatePasswordStrength,
  detectInjection,
  
  // Middlewares
  sanitizeBody,
  preventInjection,
  validateRegistration,
  validateLogin
};
