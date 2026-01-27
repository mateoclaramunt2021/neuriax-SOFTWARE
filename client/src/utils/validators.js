/* ========================================
   NEURIAX SALON MANAGER v2.0
   Validators & Schemas - Validación Premium
   PASO 22 - Form Validation Schemas
   ======================================== */

import { validators as baseValidators } from './helpers';

// ============================================
// CUSTOM VALIDATORS
// ============================================

export const validators = {
  ...baseValidators,

  // Specific validators
  serviceName: (value) => {
    if (!value) return 'El nombre del servicio es requerido';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (value.length > 100) return 'Máximo 100 caracteres';
    return null;
  },

  servicePrice: (value) => {
    if (!value) return 'El precio es requerido';
    const price = parseFloat(value);
    if (isNaN(price)) return 'Precio inválido';
    if (price <= 0) return 'El precio debe ser mayor a 0';
    if (price > 9999) return 'Precio muy alto';
    return null;
  },

  serviceDuration: (value) => {
    if (!value) return 'La duración es requerida';
    const duration = parseInt(value);
    if (isNaN(duration)) return 'Duración inválida';
    if (duration < 5) return 'Mínimo 5 minutos';
    if (duration > 480) return 'Máximo 8 horas';
    return null;
  },

  employeeName: (value) => {
    if (!value) return 'El nombre es requerido';
    if (value.length < 2) return 'Mínimo 2 caracteres';
    if (value.length > 50) return 'Máximo 50 caracteres';
    return null;
  },

  appointmentDate: (value) => {
    if (!value) return 'La fecha es requerida';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    const now = new Date();
    if (date < now) return 'La fecha debe ser futura';
    return null;
  },

  appointmentTime: (value) => {
    if (!value) return 'La hora es requerida';
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) return 'Hora inválida (HH:mm)';
    return null;
  },

  appointmentDuration: (value) => {
    if (!value) return 'La duración es requerida';
    const duration = parseInt(value);
    if (isNaN(duration)) return 'Duración inválida';
    if (duration < 15) return 'Mínimo 15 minutos';
    if (duration > 240) return 'Máximo 4 horas';
    return null;
  },

  quantity: (value) => {
    if (!value && value !== 0) return 'La cantidad es requerida';
    const qty = parseInt(value);
    if (isNaN(qty)) return 'Cantidad inválida';
    if (qty < 0) return 'La cantidad no puede ser negativa';
    if (qty > 10000) return 'Cantidad muy alta';
    return null;
  },

  price: (value) => {
    if (!value && value !== 0) return 'El precio es requerido';
    const price = parseFloat(value);
    if (isNaN(price)) return 'Precio inválido';
    if (price < 0) return 'El precio no puede ser negativo';
    if (price > 999999) return 'Precio muy alto';
    return null;
  },

  discount: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const discount = parseFloat(value);
    if (isNaN(discount)) return 'Descuento inválido';
    if (discount < 0 || discount > 100) return 'El descuento debe estar entre 0 y 100';
    return null;
  },

  tax: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const tax = parseFloat(value);
    if (isNaN(tax)) return 'Impuesto inválido';
    if (tax < 0 || tax > 100) return 'El impuesto debe estar entre 0 y 100';
    return null;
  },

  username: (value) => {
    if (!value) return 'El usuario es requerido';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (value.length > 20) return 'Máximo 20 caracteres';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Solo letras, números y guiones bajos';
    return null;
  },

  role: (value) => {
    if (!value) return 'El rol es requerido';
    const validRoles = ['admin', 'gerente', 'empleado', 'recepcion'];
    if (!validRoles.includes(value)) return 'Rol inválido';
    return null;
  },

  iban: (value) => {
    if (!value) return null;
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    if (!ibanRegex.test(value.replace(/\s/g, ''))) return 'IBAN inválido';
    return null;
  },

  businessName: (value) => {
    if (!value) return 'El nombre de negocio es requerido';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (value.length > 100) return 'Máximo 100 caracteres';
    return null;
  },

  website: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL del sitio web inválida';
    }
  },

  description: (value) => {
    if (!value) return null;
    if (value.length > 1000) return 'Máximo 1000 caracteres';
    return null;
  },

  notes: (value) => {
    if (!value) return null;
    if (value.length > 500) return 'Máximo 500 caracteres';
    return null;
  }
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const validationSchemas = {
  
  // ============ LOGIN ============
  login: {
    username: validators.required,
    password: validators.required
  },

  // ============ CLIENTES ============
  cliente: {
    nombre_completo: validators.required,
    email: validators.email,
    telefono: validators.phone,
    dni: validators.dni,
    fecha_nacimiento: validators.date,
    direccion: validators.required,
    ciudad: validators.required,
    codigo_postal: (value) => {
      if (!value) return 'El código postal es requerido';
      if (!/^\d{5}$/.test(value)) return 'Código postal inválido (5 dígitos)';
      return null;
    }
  },

  clienteUpdate: {
    nombre_completo: validators.required,
    email: validators.email,
    telefono: validators.phone,
    dni: validators.dni,
    direccion: validators.required,
    ciudad: validators.required
  },

  // ============ CITAS ============
  cita: {
    cliente_id: validators.required,
    servicio_id: validators.required,
    empleado_id: validators.required,
    fecha_cita: validators.required,
    hora_cita: validators.appointmentTime,
    duracion: validators.appointmentDuration,
    estado: (value) => {
      if (!value) return 'El estado es requerido';
      const validStates = ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_show'];
      if (!validStates.includes(value)) return 'Estado inválido';
      return null;
    },
    notas: validators.notes
  },

  citaUpdate: {
    cliente_id: validators.required,
    servicio_id: validators.required,
    empleado_id: validators.required,
    hora_cita: validators.appointmentTime,
    duracion: validators.appointmentDuration,
    estado: (value) => {
      const validStates = ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_show'];
      return !value || validStates.includes(value) ? null : 'Estado inválido';
    }
  },

  // ============ EMPLEADOS ============
  empleado: {
    nombre_completo: validators.employeeName,
    email: validators.email,
    telefono: validators.phone,
    dni: validators.dni,
    fecha_nacimiento: validators.date,
    puesto: (value) => {
      if (!value) return 'El puesto es requerido';
      if (value.length < 2) return 'Mínimo 2 caracteres';
      if (value.length > 50) return 'Máximo 50 caracteres';
      return null;
    },
    salario_base: validators.price,
    fecha_inicio: validators.date,
    numero_cuenta: validators.iban
  },

  empleadoUpdate: {
    nombre_completo: validators.employeeName,
    email: validators.email,
    telefono: validators.phone,
    puesto: (value) => {
      if (!value) return 'El puesto es requerido';
      return value.length < 2 ? 'Mínimo 2 caracteres' : null;
    },
    salario_base: validators.price
  },

  // ============ SERVICIOS ============
  servicio: {
    nombre: validators.serviceName,
    descripcion: validators.description,
    precio: validators.servicePrice,
    duracion_promedio: validators.serviceDuration,
    categoria: (value) => {
      if (!value) return 'La categoría es requerida';
      const validCategories = ['Corte', 'Color', 'Peinado', 'Tratamientos', 'Manicura', 'Pedicura', 'Facial', 'Depilación', 'Maquillaje', 'Otros'];
      if (!validCategories.includes(value)) return 'Categoría inválida';
      return null;
    }
  },

  servicioUpdate: {
    nombre: validators.serviceName,
    descripcion: validators.description,
    precio: validators.servicePrice,
    duracion_promedio: validators.serviceDuration,
    categoria: (value) => {
      const validCategories = ['Corte', 'Color', 'Peinado', 'Tratamientos', 'Manicura', 'Pedicura', 'Facial', 'Depilación', 'Maquillaje', 'Otros'];
      return !value || validCategories.includes(value) ? null : 'Categoría inválida';
    }
  },

  // ============ INVENTARIO ============
  producto: {
    nombre: (value) => {
      if (!value) return 'El nombre del producto es requerido';
      if (value.length < 2) return 'Mínimo 2 caracteres';
      if (value.length > 100) return 'Máximo 100 caracteres';
      return null;
    },
    descripcion: validators.description,
    categoria: (value) => {
      if (!value) return 'La categoría es requerida';
      const validCategories = ['Cabello', 'Color', 'Styling', 'Tratamientos', 'Uñas', 'Skincare', 'Accesorios', 'Otros'];
      if (!validCategories.includes(value)) return 'Categoría inválida';
      return null;
    },
    precio_compra: validators.price,
    precio_venta: validators.price,
    cantidad_stock: validators.quantity,
    cantidad_minima: (value) => {
      if (!value && value !== 0) return 'La cantidad mínima es requerida';
      const qty = parseInt(value);
      if (isNaN(qty)) return 'Cantidad inválida';
      if (qty < 0) return 'No puede ser negativa';
      if (qty > 10000) return 'Cantidad muy alta';
      return null;
    },
    proveedor: (value) => {
      if (!value) return 'El proveedor es requerido';
      if (value.length < 2) return 'Mínimo 2 caracteres';
      if (value.length > 100) return 'Máximo 100 caracteres';
      return null;
    }
  },

  productoUpdate: {
    nombre: (value) => {
      if (!value) return 'El nombre del producto es requerido';
      if (value.length > 100) return 'Máximo 100 caracteres';
      return null;
    },
    precio_venta: validators.price,
    cantidad_stock: validators.quantity,
    cantidad_minima: (value) => {
      if (!value && value !== 0) return 'La cantidad mínima es requerida';
      const qty = parseInt(value);
      return (isNaN(qty) || qty < 0) ? 'Cantidad inválida' : null;
    }
  },

  // ============ CAJA ============
  cajaOperacion: {
    tipo_operacion: (value) => {
      if (!value) return 'El tipo de operación es requerido';
      const validTypes = ['apertura', 'ingreso', 'egreso', 'cierre'];
      if (!validTypes.includes(value)) return 'Tipo de operación inválido';
      return null;
    },
    monto: validators.price,
    concepto: (value) => {
      if (!value) return 'El concepto es requerido';
      if (value.length < 3) return 'Mínimo 3 caracteres';
      if (value.length > 100) return 'Máximo 100 caracteres';
      return null;
    },
    metodo_pago: (value) => {
      if (!value) return 'El método de pago es requerido';
      const validMethods = ['efectivo', 'tarjeta', 'transferencia', 'bizum', 'mixto'];
      if (!validMethods.includes(value)) return 'Método de pago inválido';
      return null;
    }
  },

  // ============ VENTAS ============
  venta: {
    cliente_id: validators.required,
    empleado_id: validators.required,
    items: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return 'Debe agregar al menos un item';
      return null;
    },
    descuento: validators.discount,
    impuesto: validators.tax,
    metodo_pago: (value) => {
      if (!value) return 'El método de pago es requerido';
      const validMethods = ['efectivo', 'tarjeta', 'transferencia', 'bizum', 'mixto'];
      if (!validMethods.includes(value)) return 'Método de pago inválido';
      return null;
    },
    notas: validators.notes
  },

  ventaItem: {
    producto_id: validators.required,
    cantidad: validators.quantity,
    precio_unitario: validators.price
  },

  // ============ CONFIGURACION ============
  configuracion: {
    nombre_negocio: validators.businessName,
    email_contacto: validators.email,
    telefono_contacto: validators.phone,
    direccion: (value) => {
      if (!value) return 'La dirección es requerida';
      if (value.length < 5) return 'Mínimo 5 caracteres';
      if (value.length > 200) return 'Máximo 200 caracteres';
      return null;
    },
    ciudad: validators.required,
    codigo_postal: (value) => {
      if (!value) return 'El código postal es requerido';
      if (!/^\d{5}$/.test(value)) return 'Código postal inválido';
      return null;
    },
    web: validators.website,
    horario_apertura: validators.appointmentTime,
    horario_cierre: validators.appointmentTime,
    intervalo_citas: (value) => {
      if (!value) return 'El intervalo es requerido';
      const interval = parseInt(value);
      if (isNaN(interval)) return 'Intervalo inválido';
      if (interval < 5 || interval > 120) return 'El intervalo debe estar entre 5 y 120 minutos';
      return null;
    }
  },

  // ============ USUARIO ============
  usuario: {
    nombre_completo: validators.required,
    email: validators.email,
    username: validators.username,
    password: validators.password,
    confirmPassword: validators.confirmPassword,
    rol: validators.role
  },

  usuarioUpdate: {
    nombre_completo: validators.required,
    email: validators.email,
    rol: validators.role
  },

  // ============ CAMBIO DE CONTRASEÑA ============
  cambiarContraseña: {
    contraseña_actual: (value) => {
      if (!value) return 'La contraseña actual es requerida';
      return null;
    },
    contraseña_nueva: validators.password,
    confirmar_contraseña: (value, allValues) => {
      if (!value) return 'Confirma la contraseña';
      return value === allValues.contraseña_nueva ? null : 'Las contraseñas no coinciden';
    }
  }
};

// ============================================
// FIELD VALIDATORS (Individual field validation)
// ============================================

export const fieldValidators = {
  validateEmail: (email) => validators.email(email),
  validatePhone: (phone) => validators.phone(phone),
  validateDNI: (dni) => validators.dni(dni),
  validatePrice: (price) => validators.price(price),
  validateQuantity: (qty) => validators.quantity(qty),
  validateUsername: (username) => validators.username(username),
  validatePassword: (password) => validators.password(password),
  validateDate: (date) => validators.date(date),
  validateTime: (time) => validators.appointmentTime(time),
  validateServiceName: (name) => validators.serviceName(name),
  validateServicePrice: (price) => validators.servicePrice(price),
  validateServiceDuration: (duration) => validators.serviceDuration(duration)
};

// ============================================
// FORM VALIDATORS
// ============================================

export const validateFormData = (data, schema) => {
  const errors = {};
  
  for (const [field, validator] of Object.entries(schema)) {
    const error = typeof validator === 'function' ? validator(data[field], data) : null;
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
};

export const validateField = (fieldName, value, schema) => {
  if (!schema[fieldName]) return null;
  const validator = schema[fieldName];
  return typeof validator === 'function' ? validator(value) : null;
};

export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

export const getFieldError = (fieldName, errors) => {
  return errors[fieldName] || null;
};

export const clearFieldError = (fieldName, errors) => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};

// ============================================
// ASYNC VALIDATORS (para validaciones con API)
// ============================================

export const asyncValidators = {
  checkUsernameExists: async (username) => {
    try {
      const response = await fetch(`/api/usuarios/check-username/${username}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.exists ? 'Este usuario ya existe' : null;
    } catch (error) {
      console.error('Error checking username:', error);
      return null;
    }
  },

  checkEmailExists: async (email) => {
    try {
      const response = await fetch(`/api/usuarios/check-email/${email}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.exists ? 'Este email ya está registrado' : null;
    } catch (error) {
      console.error('Error checking email:', error);
      return null;
    }
  },

  checkProductExists: async (nombre) => {
    try {
      const response = await fetch(`/api/inventario/check-product/${nombre}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.exists ? 'Este producto ya existe' : null;
    } catch (error) {
      console.error('Error checking product:', error);
      return null;
    }
  }
};

// ============================================
// VALIDATION UTILITIES
// ============================================

export const validateClienteForm = (data) => validateFormData(data, validationSchemas.cliente);
export const validateCitaForm = (data) => validateFormData(data, validationSchemas.cita);
export const validateEmpleadoForm = (data) => validateFormData(data, validationSchemas.empleado);
export const validateServicioForm = (data) => validateFormData(data, validationSchemas.servicio);
export const validateProductoForm = (data) => validateFormData(data, validationSchemas.producto);
export const validateCajaForm = (data) => validateFormData(data, validationSchemas.cajaOperacion);
export const validateVentaForm = (data) => validateFormData(data, validationSchemas.venta);
export const validateConfigForm = (data) => validateFormData(data, validationSchemas.configuracion);
export const validateUsuarioForm = (data) => validateFormData(data, validationSchemas.usuario);
export const validateLoginForm = (data) => validateFormData(data, validationSchemas.login);

// ============================================
// ERROR MESSAGES
// ============================================

export const errorMessages = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_DNI: 'DNI/NIE inválido',
  INVALID_DATE: 'Fecha inválida',
  INVALID_PRICE: 'Precio inválido',
  INVALID_QUANTITY: 'Cantidad inválida',
  INVALID_TIME: 'Hora inválida',
  PASSWORD_TOO_SHORT: 'La contraseña es muy corta',
  PASSWORD_WEAK: 'La contraseña es muy débil',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  USERNAME_EXISTS: 'Este usuario ya existe',
  EMAIL_EXISTS: 'Este email ya está registrado',
  INVALID_RANGE: 'Valor fuera de rango',
  MAX_LENGTH_EXCEEDED: 'Ha excedido la longitud máxima',
  MIN_LENGTH_NOT_MET: 'Longitud mínima no alcanzada'
};

// ============================================
// VALIDATION RESULTS
// ============================================

export const createValidationResult = (isValid, errors = {}, data = {}) => {
  return {
    isValid,
    errors,
    data,
    hasError: (fieldName) => !!errors[fieldName],
    getError: (fieldName) => errors[fieldName] || null,
    getAllErrors: () => errors
  };
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  validators,
  validationSchemas,
  fieldValidators,
  validateFormData,
  validateField,
  isFormValid,
  getFieldError,
  clearFieldError,
  asyncValidators,
  validateClienteForm,
  validateCitaForm,
  validateEmpleadoForm,
  validateServicioForm,
  validateProductoForm,
  validateCajaForm,
  validateVentaForm,
  validateConfigForm,
  validateUsuarioForm,
  validateLoginForm,
  errorMessages,
  createValidationResult
};
