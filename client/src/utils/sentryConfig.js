/**
 * Sentry Integration - Error Tracking & Monitoring
 * NEURIAX Platform v2.5
 */

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Inicializa Sentry para monitoreo de errores
 */
export const initSentry = () => {
  // Solo inicializar en producción o si está configurado
  const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
  
  if (!SENTRY_DSN || process.env.NODE_ENV === 'development') {
    console.log('ℹ️ Sentry no configurado (desarrollo)');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new BrowserTracing(),
      ],
    });

    console.log('✅ Sentry inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Sentry:', error);
  }
};

/**
 * Captura errores personalizados
 */
export const captureError = (error, context = {}) => {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
};

/**
 * Captura mensajes importantes
 */
export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

export default Sentry;
