/**
 * Form Validators
 * NEURIAX Sistema de Cobros - Validadores reutilizables para formularios
 */

// Validadores básicos
const validators = {
  // Email
  email: (value) => {
    if (!value) return 'Email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return null;
  },

  // Teléfono
  telefono: (value) => {
    if (!value) return null; // Opcional
    const telefonoRegex = /^[0-9+\-\s()]{9,}$/;
    if (!telefonoRegex.test(value)) return 'Teléfono inválido (mínimo 9 dígitos)';
    return null;
  },

  // Nombre/Apellido
  nombre: (value, fieldName = 'Nombre') => {
    if (!value) return `${fieldName} es requerido`;
    if (value.length < 2) return `${fieldName} debe tener al menos 2 caracteres`;
    if (value.length > 100) return `${fieldName} no puede exceder 100 caracteres`;
    return null;
  },

  // Texto genérico
  texto: (value, options = {}) => {
    const { required = false, minLength = 0, maxLength = 255, fieldName = 'Campo' } = options;
    if (required && !value) return `${fieldName} es requerido`;
    if (value && value.length < minLength) return `${fieldName} debe tener al menos ${minLength} caracteres`;
    if (value && value.length > maxLength) return `${fieldName} no puede exceder ${maxLength} caracteres`;
    return null;
  },

  // Número
  numero: (value, options = {}) => {
    const { required = false, min = 0, max = Infinity, fieldName = 'Número' } = options;
    if (required && (value === null || value === '')) return `${fieldName} es requerido`;
    if (value !== null && value !== '') {
      const num = parseFloat(value);
      if (isNaN(num)) return `${fieldName} debe ser un número válido`;
      if (num < min) return `${fieldName} debe ser mayor o igual a ${min}`;
      if (num > max) return `${fieldName} debe ser menor o igual a ${max}`;
    }
    return null;
  },

  // Porcentaje
  porcentaje: (value) => {
    const error = validators.numero(value, { required: true, min: 0, max: 100, fieldName: 'Porcentaje' });
    return error;
  },

  // URL
  url: (value) => {
    if (!value) return 'URL es requerida';
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL inválida';
    }
  },

  // Fecha
  fecha: (value) => {
    if (!value) return null; // Opcional
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return null;
  },

  // DNI/NIE
  dni: (value) => {
    if (!value) return null; // Opcional
    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    if (!dniRegex.test(value.toUpperCase())) return 'DNI/NIE inválido (formato: 12345678A)';
    return null;
  },

  // Contraseña
  password: (value) => {
    if (!value) return 'Contraseña es requerida';
    if (value.length < 6) return 'Contraseña debe tener al menos 6 caracteres';
    if (value.length > 50) return 'Contraseña no puede exceder 50 caracteres';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /[0-9]/.test(value);
    // No requerimos especiales, solo combinación básica
    return null;
  },

  // Checkbox requerido
  checkbox: (value, fieldName = 'Este campo') => {
    if (!value) return `${fieldName} es requerido`;
    return null;
  },

  // Select requerido
  select: (value, fieldName = 'Selección') => {
    if (!value || value === '') return `${fieldName} es requerida`;
    return null;
  },

  // Array mínimo de items
  arrayMinItems: (value, minItems = 1, fieldName = 'Campo') => {
    if (!Array.isArray(value) || value.length < minItems) {
      return `${fieldName} debe tener al menos ${minItems} elemento(s)`;
    }
    return null;
  },
};

/**
 * Validador de formulario completo
 * @param {Object} formData - Datos del formulario
 * @param {Object} schema - Schema de validación { fieldName: validator o { validator, options } }
 * @returns {Object} Objeto con errores por campo { fieldName: 'error message' }
 */
export const validateForm = (formData, schema) => {
  const errors = {};

  Object.keys(schema).forEach((fieldName) => {
    const rule = schema[fieldName];
    const value = formData[fieldName];

    if (typeof rule === 'function') {
      const error = rule(value);
      if (error) errors[fieldName] = error;
    } else if (rule && typeof rule === 'object') {
      const { validator, options } = rule;
      if (validator) {
        const error = validator(value, options);
        if (error) errors[fieldName] = error;
      }
    }
  });

  return errors;
};

/**
 * Hook para usar en componentes React
 * Retorna { formData, setFormData, errors, setErrors, validateField, validateForm, isValid }
 */
export const useFormValidation = (initialData, schema) => {
  const [formData, setFormData] = require('react').useState(initialData);
  const [errors, setErrors] = require('react').useState({});

  const validateField = (fieldName, value) => {
    const rule = schema[fieldName];
    let error = null;

    if (typeof rule === 'function') {
      error = rule(value);
    } else if (rule && typeof rule === 'object') {
      const { validator, options } = rule;
      if (validator) {
        error = validator(value, options);
      }
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return !error;
  };

  const validateAllFields = () => {
    const newErrors = validateForm(formData, schema);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValid = Object.keys(errors).length === 0;

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    validateField,
    validateAllFields,
    isValid,
  };
};

// Esquemas predefinidos para módulos comunes
export const formSchemas = {
  // Cliente
  cliente: {
    nombre: { validator: validators.nombre, options: {} },
    apellidos: { validator: validators.nombre, options: { fieldName: 'Apellidos' } },
    email: validators.email,
    telefono: validators.telefono,
    documento_identidad: validators.dni,
  },

  // Empleado
  empleado: {
    nombre: { validator: validators.nombre, options: {} },
    apellidos: { validator: validators.nombre, options: { fieldName: 'Apellidos' } },
    email: validators.email,
    telefono: validators.telefono,
    rol: { validator: validators.select, options: 'Rol' },
    documento_identidad: validators.dni,
  },

  // Servicio
  servicio: {
    nombre: { validator: validators.nombre, options: {} },
    descripcion: { validator: validators.texto, options: { maxLength: 500 } },
    precio: { validator: validators.numero, options: { required: true, min: 0, fieldName: 'Precio' } },
  },

  // Producto
  producto: {
    nombre: { validator: validators.nombre, options: {} },
    precio: { validator: validators.numero, options: { required: true, min: 0, fieldName: 'Precio' } },
    cantidad: { validator: validators.numero, options: { required: true, min: 0, fieldName: 'Cantidad' } },
  },
};

export default validators;
