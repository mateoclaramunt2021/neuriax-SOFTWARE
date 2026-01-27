/* ========================================
   NEURIAX SALON MANAGER v2.0
   Error Formatter & Display Utilities
   Formatea errores para mostrar al usuario
   ======================================== */

// ============================================
// SPANISH ERROR MESSAGES
// ============================================

const ERROR_MESSAGES = {
  // Network Errors
  NETWORK_ERROR: 'Error de conexión. Verifique su internet.',
  TIMEOUT: 'La solicitud tardó demasiado. Intente de nuevo.',
  CONNECTION_REFUSED: 'No se puede conectar al servidor.',
  SERVER_ERROR: 'Error del servidor. Intente más tarde.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  UNAUTHORIZED: 'No está autorizado. Inicie sesión de nuevo.',
  FORBIDDEN: 'No tiene permiso para acceder a este recurso.',
  BAD_REQUEST: 'Los datos enviados no son válidos.',

  // Validation Errors
  VALIDATION_ERROR: 'Por favor revise los datos ingresados.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
  INVALID_PHONE: 'El teléfono no es válido.',
  INVALID_DATE: 'La fecha no es válida.',
  INVALID_PASSWORD: 'La contraseña no cumple los requisitos.',
  REQUIRED_FIELD: 'Este campo es requerido.',
  MIN_LENGTH: 'El mínimo de caracteres es',
  MAX_LENGTH: 'El máximo de caracteres es',

  // Auth Errors
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
  SESSION_EXPIRED: 'Su sesión ha expirado. Inicie sesión de nuevo.',
  INVALID_TOKEN: 'Token inválido. Inicie sesión de nuevo.',
  NOT_AUTHENTICATED: 'Debe iniciar sesión.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  USER_ALREADY_EXISTS: 'El usuario ya existe.',

  // Business Logic Errors
  INSUFFICIENT_FUNDS: 'Fondos insuficientes.',
  INVALID_OPERATION: 'Operación no válida.',
  DUPLICATE_ENTRY: 'Ya existe un registro con estos datos.',
  CANNOT_DELETE: 'No se puede eliminar este registro.',
  INVALID_STATUS: 'Estado no válido para esta operación.',
  APPOINTMENT_CONFLICT: 'Hay un conflicto con otra cita.',
  INVALID_DATE_RANGE: 'El rango de fechas no es válido.',

  // Data Errors
  NO_DATA: 'No hay datos disponibles.',
  INVALID_DATA: 'Los datos recibidos no son válidos.',
  MISSING_FIELDS: 'Faltan campos requeridos.',
  DATA_MISMATCH: 'Los datos no coinciden.',

  // File Errors
  FILE_TOO_LARGE: 'El archivo es demasiado grande.',
  INVALID_FILE_TYPE: 'Tipo de archivo no válido.',
  FILE_UPLOAD_FAILED: 'Error al cargar el archivo.',

  // Generic
  UNKNOWN_ERROR: 'Ocurrió un error inesperado.',
  TRY_AGAIN: 'Intente de nuevo.',
  CONTACT_SUPPORT: 'Contacte al soporte técnico.'
};

// ============================================
// ERROR FORMATTER
// ============================================

/**
 * Formatea un error para mostrar al usuario
 * @param {Error|string} error - El error a formatear
 * @param {Object} options - Opciones de formateo
 * @returns {Object} Error formateado con propiedades de UI
 */
export const formatError = (error, options = {}) => {
  const {
    includeDetails = false,
    includeStack = false,
    severity = 'error'
  } = options;

  const formatted = {
    title: getErrorTitle(error),
    message: getErrorMessage(error),
    code: getErrorCode(error),
    type: getErrorType(error),
    severity,
    timestamp: new Date().toISOString(),
    isDevelopment: process.env.NODE_ENV === 'development'
  };

  if (includeDetails && error) {
    formatted.details = {
      originalMessage: error.message,
      stack: error.stack,
      name: error.name,
      response: error?.response?.data
    };
  }

  if (includeStack && error?.stack) {
    formatted.stack = error.stack.split('\n');
  }

  return formatted;
};

/**
 * Obtiene el título del error
 */
export const getErrorTitle = (error) => {
  if (!error) return 'Error desconocido';

  if (typeof error === 'string') return 'Error';

  const code = getErrorCode(error);
  const codeMap = {
    '400': 'Solicitud inválida',
    '401': 'No autorizado',
    '403': 'Acceso denegado',
    '404': 'No encontrado',
    '409': 'Conflicto',
    '500': 'Error del servidor',
    '503': 'Servicio no disponible',
    'VALIDATION_ERROR': 'Error de validación',
    'AUTH_ERROR': 'Error de autenticación',
    'NETWORK_ERROR': 'Error de red'
  };

  return codeMap[code] || 'Error';
};

/**
 * Obtiene el mensaje del error
 */
export const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

  if (typeof error === 'string') return error;

  // Error de respuesta HTTP
  if (error?.response?.status) {
    return getHttpErrorMessage(error.response.status, error.response.data);
  }

  // Errores predefinidos
  if (ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  if (ERROR_MESSAGES[error.name]) {
    return ERROR_MESSAGES[error.name];
  }

  // Mensaje personalizado
  if (error.message) {
    return translateErrorMessage(error.message);
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Obtiene el código del error
 */
export const getErrorCode = (error) => {
  if (!error) return 'UNKNOWN_ERROR';

  return (
    error.code ||
    error.name ||
    error?.response?.status ||
    'UNKNOWN_ERROR'
  );
};

/**
 * Obtiene el tipo del error
 */
export const getErrorType = (error) => {
  if (!error) return 'unknown';

  if (error.name === 'ValidationError') return 'validation';
  if (error.name === 'AuthError') return 'auth';
  if (error.name === 'NetworkError') return 'network';
  if (error.name === 'BusinessLogicError') return 'business';

  if (error?.response?.status >= 500) return 'server';
  if (error?.response?.status >= 400) return 'client';
  if (error?.code === 'ECONNREFUSED') return 'network';
  if (error?.code === 'ECONNABORTED') return 'network';

  return 'unknown';
};

/**
 * Obtiene el mensaje de error HTTP
 */
export const getHttpErrorMessage = (status, data) => {
  const messages = {
    400: ERROR_MESSAGES.BAD_REQUEST,
    401: ERROR_MESSAGES.UNAUTHORIZED,
    403: ERROR_MESSAGES.FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
    409: 'Conflicto: ' + (data?.message || 'Los datos ya existen'),
    500: ERROR_MESSAGES.SERVER_ERROR,
    503: 'Servicio no disponible. Intente más tarde.'
  };

  // Si hay un mensaje específico en los datos
  if (data?.message) {
    return translateErrorMessage(data.message);
  }

  return messages[status] || ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Traduce mensajes de error comunes del inglés al español
 */
export const translateErrorMessage = (message) => {
  if (!message || typeof message !== 'string') return ERROR_MESSAGES.UNKNOWN_ERROR;

  const translations = {
    'not found': 'no encontrado',
    'already exists': 'ya existe',
    'invalid': 'no válido',
    'required': 'requerido',
    'unauthorized': 'no autorizado',
    'forbidden': 'prohibido',
    'network': 'red',
    'timeout': 'tiempo agotado',
    'failed': 'falló',
    'error': 'error'
  };

  let translated = message.toLowerCase();
  Object.entries(translations).forEach(([en, es]) => {
    translated = translated.replace(new RegExp(en, 'g'), es);
  });

  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

/**
 * Formatea errores de validación de formulario
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return [];

  return Object.entries(errors).map(([field, error]) => ({
    field,
    message: typeof error === 'string' ? error : error.message || ERROR_MESSAGES.VALIDATION_ERROR,
    type: 'validation'
  }));
};

/**
 * Crea un objeto de notificación de error para mostrar al usuario
 */
export const createErrorNotification = (error, options = {}) => {
  const formatted = formatError(error, options);

  return {
    type: 'error',
    title: formatted.title,
    message: formatted.message,
    code: formatted.code,
    severity: formatted.severity,
    timestamp: formatted.timestamp,
    isDismissible: true,
    duration: options.duration || 5000,
    action: options.action || null,
    details: options.includeDetails ? formatted.details : null
  };
};

/**
 * Crea un objeto de notificación de advertencia
 */
export const createWarningNotification = (message, options = {}) => {
  return {
    type: 'warning',
    title: options.title || 'Advertencia',
    message,
    isDismissible: true,
    duration: options.duration || 4000,
    action: options.action || null
  };
};

/**
 * Extrae errores de un objeto de validación
 */
export const extractValidationErrors = (validationObject) => {
  if (!validationObject) return {};

  const errors = {};

  Object.entries(validationObject).forEach(([key, value]) => {
    if (value && value.errors && Array.isArray(value.errors)) {
      errors[key] = value.errors[0];
    } else if (typeof value === 'string') {
      errors[key] = value;
    }
  });

  return errors;
};

/**
 * Formatea un error de API para logging
 */
export const formatApiError = (error, endpoint, method) => {
  return {
    type: 'api_error',
    endpoint,
    method,
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    message: error?.message,
    timestamp: new Date().toISOString(),
    responseData: error?.response?.data,
    code: error?.code
  };
};

/**
 * Obtiene un mensaje amigable para el usuario por tipo de operación
 */
export const getOperationErrorMessage = (operation, error) => {
  const operationMessages = {
    create: {
      default: 'No se pudo crear el registro.',
      validation: 'Verifique los datos ingresados.',
      duplicate: 'Este registro ya existe.',
      unauthorized: 'No tiene permisos para crear registros.'
    },
    update: {
      default: 'No se pudo actualizar el registro.',
      validation: 'Verifique los datos ingresados.',
      notFound: 'El registro no fue encontrado.',
      unauthorized: 'No tiene permisos para actualizar.'
    },
    delete: {
      default: 'No se pudo eliminar el registro.',
      notFound: 'El registro no fue encontrado.',
      unauthorized: 'No tiene permisos para eliminar.',
      conflict: 'No se puede eliminar este registro.'
    },
    fetch: {
      default: 'No se pudieron obtener los datos.',
      notFound: 'No hay datos disponibles.',
      unauthorized: 'No tiene permisos para ver estos datos.',
      network: 'Error de conexión.'
    }
  };

  const errorType = getErrorType(error);
  const messages = operationMessages[operation];

  if (!messages) return getErrorMessage(error);

  return messages[errorType] || messages.default;
};

/**
 * Formatea errores de múltiples campos
 */
export const formatMultiFieldError = (errors) => {
  const summary = {
    total: 0,
    byField: {},
    message: ''
  };

  Object.entries(errors).forEach(([field, error]) => {
    summary.total++;
    summary.byField[field] = error;
  });

  if (summary.total === 1) {
    const [field, error] = Object.entries(errors)[0];
    summary.message = `${field}: ${error}`;
  } else {
    summary.message = `${summary.total} campos con errores`;
  }

  return summary;
};

/**
 * Crea un reporte legible de errores
 */
export const createErrorReport = (errors, context = {}) => {
  const report = {
    timestamp: new Date().toISOString(),
    context,
    errors: Array.isArray(errors) ? errors : [errors],
    summary: {
      total: Array.isArray(errors) ? errors.length : 1,
      critical: 0,
      warnings: 0
    }
  };

  report.errors.forEach(error => {
    const type = getErrorType(error);
    if (type === 'server' || type === 'network') {
      report.summary.critical++;
    } else if (type === 'validation') {
      report.summary.warnings++;
    }
  });

  return report;
};

export default {
  formatError,
  getErrorTitle,
  getErrorMessage,
  getErrorCode,
  getErrorType,
  getHttpErrorMessage,
  translateErrorMessage,
  formatValidationErrors,
  createErrorNotification,
  createWarningNotification,
  extractValidationErrors,
  formatApiError,
  getOperationErrorMessage,
  formatMultiFieldError,
  createErrorReport,
  ERROR_MESSAGES
};
