/* ========================================
   NEURIAX SALON MANAGER v2.0
   Error Handlers Initialization
   Gestiona errores globales y middlewares
   ======================================== */

import { errorLogger } from './errorLogger';

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

/**
 * Inicializa todos los manejadores de error globales
 * Debe ser llamado una sola vez cuando la app inicia
 */
export const initializeErrorHandlers = () => {
  // Ya se inicializa en errorLogger constructor,
  // pero podemos añadir lógica adicional aquí
  console.log('[ErrorHandlers] Initialized global error handlers');
};

/**
 * Maneja errores de API con contexto
 */
export const handleApiError = (error, endpoint, method = 'GET') => {
  const errorData = {
    endpoint,
    method,
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    data: error?.response?.data
  };

  if (error?.response?.status >= 500) {
    errorLogger.critical(
      `Server Error (${error.response.status}): ${endpoint}`,
      error,
      errorData
    );
  } else if (error?.response?.status >= 400) {
    errorLogger.warn(
      `Client Error (${error.response.status}): ${endpoint}`,
      errorData
    );
  } else if (error?.code === 'ECONNABORTED') {
    errorLogger.error(
      `Request Timeout: ${endpoint}`,
      error,
      errorData
    );
  } else {
    errorLogger.error(
      `Network Error: ${endpoint}`,
      error,
      errorData
    );
  }

  return createErrorResponse(error, errorData);
};

/**
 * Maneja errores de validación con detalles de campos
 */
export const handleValidationError = (error, fields = {}) => {
  const errorData = {
    type: 'validation',
    fields,
    timestamp: new Date().toISOString()
  };

  errorLogger.warn(
    `Validation Error: ${error.message}`,
    errorData
  );

  return createErrorResponse(error, errorData);
};

/**
 * Maneja errores de autenticación
 */
export const handleAuthError = (error, context = {}) => {
  const errorData = {
    type: 'auth',
    ...context,
    timestamp: new Date().toISOString()
  };

  if (error?.message?.includes('expired')) {
    errorLogger.warn('Session expired', errorData);
  } else if (error?.message?.includes('invalid')) {
    errorLogger.warn('Invalid credentials', errorData);
  } else {
    errorLogger.error('Authentication error', error, errorData);
  }

  return createErrorResponse(error, errorData);
};

/**
 * Maneja errores de lógica de negocio
 */
export const handleBusinessError = (error, context = {}) => {
  const errorData = {
    type: 'business',
    ...context,
    timestamp: new Date().toISOString()
  };

  errorLogger.warn(
    `Business Logic Error: ${error.message}`,
    errorData
  );

  return createErrorResponse(error, errorData);
};

/**
 * Maneja errores asíncronos con retry
 */
export const handleAsyncErrorWithRetry = async (
  asyncFn,
  maxRetries = 3,
  delayMs = 1000,
  context = {}
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;

      errorLogger.warn(
        `Async Error (Attempt ${attempt}/${maxRetries}): ${error.message}`,
        { ...context, attempt, maxRetries }
      );

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  errorLogger.error(
    `Async Error Failed After ${maxRetries} Attempts`,
    lastError,
    context
  );

  throw lastError;
};

/**
 * Maneja errores de formulario
 */
export const handleFormError = (error, formData = {}, fieldErrors = {}) => {
  const errorData = {
    type: 'form',
    fieldErrors,
    timestamp: new Date().toISOString()
  };

  errorLogger.warn(
    `Form Error: ${error.message}`,
    errorData
  );

  return createErrorResponse(error, errorData);
};

/**
 * Crea un objeto de respuesta de error consistente
 */
export const createErrorResponse = (error, additionalData = {}) => {
  return {
    success: false,
    error: {
      message: error?.message || 'An unknown error occurred',
      code: error?.code || 'UNKNOWN_ERROR',
      type: error?.constructor?.name,
      timestamp: new Date().toISOString(),
      ...additionalData
    }
  };
};

/**
 * Convierte error a mensaje amigable para el usuario
 */
export const getErrorMessage = (error) => {
  const errorMap = {
    'ECONNREFUSED': 'No se puede conectar al servidor. Verifique su conexión.',
    'ECONNABORTED': 'La solicitud fue cancelada. Intente de nuevo.',
    'ERR_NETWORK': 'Error de conexión. Verifique su internet.',
    'ValidationError': 'Los datos proporcionados no son válidos.',
    'AuthError': 'Error de autenticación. Inicie sesión de nuevo.',
    'NetworkError': 'Error de red. Verifique su conexión.',
    'BusinessLogicError': 'Error en la operación. Intente de nuevo.'
  };

  const key = error?.code || error?.constructor?.name;
  return errorMap[key] || error?.message || 'Ocurrió un error inesperado';
};

/**
 * Registra el contexto del usuario para debugging
 */
export const captureUserContext = () => {
  const context = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };

  // Intenta obtener info del usuario del localStorage
  const user = localStorage.getItem('user');
  if (user) {
    try {
      context.user = JSON.parse(user);
    } catch (e) {
      // Ignora errores de parseo
    }
  }

  return context;
};

/**
 * Wrapper para funciones síncronas con error handling
 */
export const withErrorHandling = (fn, context = {}) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      errorLogger.error(
        `Error in ${fn.name || 'function'}`,
        error,
        { ...context, args }
      );
      throw error;
    }
  };
};

/**
 * Wrapper para funciones asíncronas con error handling
 */
export const withAsyncErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorLogger.error(
        `Error in async ${fn.name || 'function'}`,
        error,
        { ...context, args }
      );
      throw error;
    }
  };
};

/**
 * Middleware para capturar errores en promesas
 */
export const setupPromiseErrorHandler = () => {
  window.addEventListener('unhandledrejection', event => {
    errorLogger.critical(
      'Unhandled Promise Rejection',
      event.reason,
      {
        promise: event.promise,
        type: 'unhandledRejection'
      }
    );
  });
};

/**
 * Obtiene historial de errores recientes
 */
export const getRecentErrors = (limit = 10) => {
  return errorLogger.getLogs({
    minLevel: 2, // WARN and above
    limit
  });
};

/**
 * Limpia logs de error
 */
export const clearErrorLogs = () => {
  errorLogger.clearLogs();
};

/**
 * Exporta reporte de errores
 */
export const exportErrorReport = (format = 'json') => {
  const errors = getRecentErrors(100);
  const stats = errorLogger.getLogStats();
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    recentErrors: errors,
    userContext: captureUserContext()
  };

  if (format === 'csv') {
    return convertReportToCsv(report);
  }

  return JSON.stringify(report, null, 2);
};

/**
 * Convierte reporte a formato CSV
 */
const convertReportToCsv = (report) => {
  const headers = ['Timestamp', 'Level', 'Message', 'Code', 'Type'];
  const rows = report.recentErrors.map(log => [
    log.timestamp,
    log.level,
    log.message,
    log.context?.error?.code || 'N/A',
    log.context?.error?.type || 'N/A'
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
};

/**
 * Recuperación de errores críticos
 */
export const recoverFromCriticalError = () => {
  // Limpia estado potencialmente corrupto
  try {
    sessionStorage.clear();
    localStorage.removeItem('temp_data');
    
    // Recargar sin cache
    window.location.href = window.location.href;
  } catch (error) {
    errorLogger.critical('Recovery failed', error);
    // Fallback: reload normal
    window.location.reload();
  }
};

/**
 * Configuración de error handlers según el ambiente
 */
export const configureErrorHandlersByEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    // En producción, enviar errores críticos a servidor
    errorLogger.CONFIG.enableRemote = true;
    errorLogger.CONFIG.remoteEndpoint = '/api/logs';
  } else {
    // En desarrollo, mostrar detalles completos
    errorLogger.CONFIG.isDevelopment = true;
  }
};

export default {
  initializeErrorHandlers,
  handleApiError,
  handleValidationError,
  handleAuthError,
  handleBusinessError,
  handleAsyncErrorWithRetry,
  handleFormError,
  createErrorResponse,
  getErrorMessage,
  captureUserContext,
  withErrorHandling,
  withAsyncErrorHandling,
  setupPromiseErrorHandler,
  getRecentErrors,
  clearErrorLogs,
  exportErrorReport,
  recoverFromCriticalError,
  configureErrorHandlersByEnvironment
};
