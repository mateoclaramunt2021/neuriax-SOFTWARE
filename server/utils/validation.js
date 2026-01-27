/**
 * Input Validation Utilities - NEURIAX Platform
 * Valida y sanitiza inputs de usuario para prevenir ataques
 * @module utils/validation
 */

const crypto = require('crypto');

/**
 * Valida que un email sea válido
 * @param {string} email - Email a validar
 * @returns {boolean} true si email es válido, false caso contrario
 * @example
 * validateEmail('user@ejemplo.com') // true
 * validateEmail('email-invalido') // false
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
};

/**
 * Valida que una contraseña sea fuerte
 * Requisitos: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial
 * @param {string} password - Contraseña a validar
 * @returns {Object} {valid: boolean, errors: string[]}
 * @example
 * validatePassword('Test1234!') // {valid: true, errors: []}
 * validatePassword('weak') // {valid: false, errors: [...]}
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida que un username sea válido
 * Permite: letras, números, guiones bajos, mínimo 3 caracteres, máximo 20
 * @param {string} username - Username a validar
 * @returns {boolean} true si es válido, false caso contrario
 * @example
 * validateUsername('usuario123') // true
 * validateUsername('ab') // false
 */
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return typeof username === 'string' && usernameRegex.test(username);
};

/**
 * Valida que un número de teléfono sea válido (formato: +34 XXXXXXXXX)
 * @param {string} phone - Número de teléfono
 * @returns {boolean} true si es válido, false caso contrario
 * @example
 * validatePhone('+34611223344') // true
 * validatePhone('611223344') // false
 */
const validatePhone = (phone) => {
  const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{9,}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitiza input de texto para prevenir XSS
 * Remueve caracteres HTML y scripts potencialmente peligrosos
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto sanitizado
 * @example
 * sanitizeText('<img src=x onerror="alert(1)">') // '&lt;img src=x onerror="alert(1)"&gt;'
 */
const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Valida objeto de usuario (login/registro)
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña del usuario
 * @param {string} [userData.username] - Username (opcional)
 * @returns {Object} {valid: boolean, errors: string[]}
 * @example
 * validateUserData({
 *   email: 'user@ejemplo.com',
 *   password: 'SecurePass123!',
 *   username: 'usuario123'
 * })
 */
const validateUserData = (userData) => {
  const errors = [];

  // Validar email
  if (!userData.email || !validateEmail(userData.email)) {
    errors.push('Email inválido');
  }

  // Validar contraseña
  if (!userData.password) {
    errors.push('Contraseña requerida');
  } else {
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Validar username si se proporciona
  if (userData.username && !validateUsername(userData.username)) {
    errors.push('Username inválido (3-20 caracteres, solo letras, números y guiones bajos)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida que un número sea un entero positivo
 * @param {*} value - Valor a validar
 * @returns {boolean} true si es entero positivo, false caso contrario
 * @example
 * validatePositiveInteger(5) // true
 * validatePositiveInteger(-5) // false
 * validatePositiveInteger(5.5) // false
 */
const validatePositiveInteger = (value) => {
  return Number.isInteger(value) && value > 0;
};

/**
 * Valida que un valor sea una cantidad monetaria válida
 * Permite: números positivos con hasta 2 decimales
 * @param {*} amount - Cantidad a validar
 * @returns {boolean} true si es válida, false caso contrario
 * @example
 * validateAmount(99.99) // true
 * validateAmount(99.999) // false
 */
const validateAmount = (amount) => {
  if (typeof amount !== 'number' || amount < 0) return false;
  // Verificar que tenga máximo 2 decimales
  return /^\d+(\.\d{1,2})?$/.test(amount.toString());
};

/**
 * Valida URL
 * @param {string} url - URL a validar
 * @returns {boolean} true si es válida, false caso contrario
 * @example
 * validateURL('https://ejemplo.com') // true
 * validateURL('no-es-url') // false
 */
const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida objeto de fecha (año, mes, día)
 * @param {Object} dateObj - Objeto con propiedades año, mes, día
 * @returns {boolean} true si es fecha válida, false caso contrario
 * @example
 * validateDate({año: 2026, mes: 1, dia: 27}) // true
 * validateDate({año: 2026, mes: 13, dia: 27}) // false
 */
const validateDate = (dateObj) => {
  if (!dateObj.año || !dateObj.mes || !dateObj.dia) return false;
  
  const date = new Date(dateObj.año, dateObj.mes - 1, dateObj.dia);
  return (
    date.getFullYear() === dateObj.año &&
    date.getMonth() === dateObj.mes - 1 &&
    date.getDate() === dateObj.dia
  );
};

/**
 * Valida que objeto contenga campos requeridos
 * @param {Object} obj - Objeto a validar
 * @param {string[]} requiredFields - Array de campos requeridos
 * @returns {Object} {valid: boolean, missingFields: string[]}
 * @example
 * validateRequiredFields({nombre: 'Juan'}, ['nombre', 'email'])
 * // {valid: false, missingFields: ['email']}
 */
const validateRequiredFields = (obj, requiredFields) => {
  const missingFields = requiredFields.filter(field => !obj[field]);
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Sanitiza y valida objeto de entrada
 * Remueve campos sospechosos y valida tipos
 * @param {Object} input - Objeto de entrada
 * @param {string[]} allowedFields - Campos permitidos
 * @returns {Object} Objeto sanitizado con solo campos permitidos
 * @example
 * sanitizeObject({nombre: 'Juan', __proto__: {}}, ['nombre', 'email'])
 * // {nombre: 'Juan'}
 */
const sanitizeObject = (input, allowedFields) => {
  const sanitized = {};
  
  allowedFields.forEach(field => {
    if (input[field] !== undefined) {
      const value = input[field];
      
      // Sanitizar strings
      if (typeof value === 'string') {
        sanitized[field] = sanitizeText(value);
      }
      // Mantener números como están
      else if (typeof value === 'number') {
        sanitized[field] = value;
      }
      // Mantener booleanos como están
      else if (typeof value === 'boolean') {
        sanitized[field] = value;
      }
      // No permitir objetos anidados por defecto
    }
  });
  
  return sanitized;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  sanitizeText,
  validateUserData,
  validatePositiveInteger,
  validateAmount,
  validateURL,
  validateDate,
  validateRequiredFields,
  sanitizeObject
};
