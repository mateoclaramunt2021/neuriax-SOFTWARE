/* ========================================
   NEURIAX SALON MANAGER v2.0
   API Interceptors
   Interceptores para manejo de errores, auth, reintentos
   ======================================== */

import { errorLogger } from '../utils/errorLogger';
import authService from '../services/authService';
import { handleAuthError, handleValidationError } from '../utils/errorHandlers';

/**
 * Interceptor de Autenticación
 * - Agregar token a headers
 * - Manejar token expirado
 */
export const authInterceptor = {
  beforeRequest: async (config) => {
    try {
      const token = authService.getToken?.();

      if (token && authService.isTokenExpiringSoon?.(token)) {
        // Intentar refrescar token
        try {
          await authService.refreshAccessToken?.();
        } catch (error) {
          errorLogger.warn('Token refresh failed', error);
          // Continuar con token actual
        }
      }

      return config;
    } catch (error) {
      errorLogger.error('Auth interceptor error', error);
      return config;
    }
  },

  onError: async (config) => {
    if (config.error.status === 401) {
      // Token inválido o expirado
      await handleAuthError(config.error);
    }
    return config;
  },
};

/**
 * Interceptor de Validación
 * - Validar datos de respuesta
 * - Transformar datos
 */
export const validationInterceptor = {
  afterResponse: async (config) => {
    try {
      // Validar que data no sea null
      if (config.data === null || config.data === undefined) {
        config.data = {};
      }

      // Validar arrays
      if (Array.isArray(config.data)) {
        config.data = config.data.filter(item => item !== null && item !== undefined);
      }

      return config;
    } catch (error) {
      errorLogger.warn('Validation interceptor error', error);
      return config;
    }
  },

  onError: async (config) => {
    if (config.error.status === 422) {
      // Error de validación
      await handleValidationError(config.error);
    }
    return config;
  },
};

/**
 * Interceptor de Manejo de Errores
 * - Log centralizado
 * - Transformar errores
 */
export const errorHandlingInterceptor = {
  onError: async (config) => {
    const { error, endpoint, method } = config;

    // Log del error
    errorLogger.error(`[${method}] ${endpoint}`, {
      status: error.status,
      message: error.message,
      data: error.data,
    });

    // Transformar error en mensaje amigable
    const errorMessage = transformErrorMessage(error);

    const transformedError = new Error(errorMessage);
    transformedError.status = error.status;
    transformedError.data = error.data;
    transformedError.original = error;

    config.error = transformedError;
    return config;
  },
};

/**
 * Interceptor de Caché
 * - Cache GET requests
 * - Invalidar cache en POST/PUT/DELETE
 */
const cache = new Map();

export const cacheInterceptor = {
  beforeRequest: async (config) => {
    // Check cache para GET
    if (config.method === 'GET') {
      const cached = cache.get(config.url);
      if (cached && !isExpired(cached)) {
        return {
          ...config,
          cached: true,
          cachedData: cached.data,
        };
      }
    }
    return config;
  },

  afterResponse: async (config) => {
    // Cache GET responses
    if (config.status === 200) {
      cache.set(config.url || 'unknown', {
        data: config.data,
        timestamp: Date.now(),
      });
    }
    return config;
  },
};

/**
 * Verificar si cache está expirado (5 minutos)
 */
const isExpired = (cached) => {
  return Date.now() - cached.timestamp > 5 * 60 * 1000;
};

/**
 * Interceptor de Logging
 * - Log detallado de requests/responses
 */
export const loggingInterceptor = {
  beforeRequest: async (config) => {
    errorLogger.debug(`[${config.method}] ${config.url} - Request started`, {
      headers: config.headers,
      body: config.body ? JSON.parse(config.body) : null,
    });
    return config;
  },

  afterResponse: async (config) => {
    const duration = Date.now() - (config._startTime || Date.now());
    errorLogger.debug(`[${config.status}] Response received - ${duration}ms`, {
      url: config.url,
      dataSize: JSON.stringify(config.data).length,
    });
    return config;
  },

  onError: async (config) => {
    errorLogger.error(`[ERROR] ${config.method} ${config.endpoint}`, {
      status: config.error.status,
      message: config.error.message,
    });
    return config;
  },
};

/**
 * Interceptor de Rate Limiting
 * - Evitar demasiadas solicitudes
 */
const requestQueue = [];
let isProcessing = false;

export const rateLimitInterceptor = {
  beforeRequest: async (config) => {
    requestQueue.push(config);

    if (!isProcessing) {
      isProcessing = true;

      while (requestQueue.length > 0) {
        // Esperar 100ms entre requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      isProcessing = false;
    }

    return requestQueue.shift() || config;
  },
};

/**
 * Interceptor de Reintentos
 * - Reintentar solicitudes que fallan
 */
export const retryInterceptor = {
  onError: async (config) => {
    const { error } = config;

    // No reintentar errores 4xx
    if (error.status && error.status >= 400 && error.status < 500) {
      return config;
    }

    // Reintentar otros errores
    config.shouldRetry = true;
    return config;
  },
};

/**
 * Interceptor de Normalización
 * - Normalizar respuestas
 */
export const normalizationInterceptor = {
  afterResponse: async (config) => {
    // Envolver array en objeto
    if (Array.isArray(config.data)) {
      config.data = {
        data: config.data,
        total: config.data.length,
      };
    }

    // Agregar metadata
    config.data._metadata = {
      timestamp: new Date().toISOString(),
      status: config.status,
    };

    return config;
  },
};

/**
 * Interceptor de Tiempo
 * - Medir tiempo de response
 */
export const timingInterceptor = {
  beforeRequest: async (config) => {
    config._startTime = Date.now();
    return config;
  },

  afterResponse: async (config) => {
    const duration = Date.now() - (config._startTime || 0);
    config._duration = duration;

    if (duration > 3000) {
      errorLogger.warn(`Slow response: ${duration}ms`, {
        url: config.url,
      });
    }

    return config;
  },
};

/**
 * Transformar mensaje de error según status
 */
const transformErrorMessage = (error) => {
  const status = error.status;
  const messages = {
    400: 'Solicitud inválida',
    401: 'No autorizado - inicie sesión',
    403: 'No tiene permiso para acceder',
    404: 'Recurso no encontrado',
    408: 'Tiempo de espera agotado',
    409: 'Conflicto - recurso ya existe',
    422: 'Datos inválidos',
    429: 'Demasiadas solicitudes',
    500: 'Error del servidor',
    502: 'Puerta de enlace incorrecta',
    503: 'Servicio no disponible',
    504: 'Tiempo de espera de la puerta de enlace',
  };

  if (status && messages[status]) {
    return messages[status];
  }

  if (!status) {
    return 'Error de conexión';
  }

  return error.message || 'Error desconocido';
};

/**
 * Todos los interceptores
 */
export const allInterceptors = [
  authInterceptor,
  validationInterceptor,
  errorHandlingInterceptor,
  cacheInterceptor,
  loggingInterceptor,
  timingInterceptor,
  normalizationInterceptor,
  retryInterceptor,
];

export default allInterceptors;
