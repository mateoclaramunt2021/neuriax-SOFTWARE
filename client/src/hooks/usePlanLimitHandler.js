import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook personalizado para manejar errores de límites de plan
 * Captura errores 403 con PLAN_LIMIT_REACHED y dispara modal
 */
export const usePlanLimitHandler = (onLimitReached) => {
  const [error, setError] = useState(null);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'PLAN_LIMIT_REACHED') {
      const { data } = error.response.data;
      onLimitReached({
        resourceType: data.actionType,
        current: data.current,
        limit: data.limit,
        planName: data.planName,
        planId: data.planId
      });
      return true; // Error manejado
    }
    setError(error.response?.data?.message || 'Error en la solicitud');
    return false;
  }, [onLimitReached]);

  const createWithLimitCheck = useCallback(async (endpoint, payload) => {
    try {
      const response = await api.post(endpoint, payload);
      return { success: true, data: response.data };
    } catch (err) {
      const handled = handleApiError(err);
      if (!handled) {
        return { success: false, error: err.response?.data?.message || err.message };
      }
      return { success: false, limitReached: true, data: err.response?.data?.data };
    }
  }, [handleApiError]);

  return {
    createWithLimitCheck,
    error,
    setError,
    handleApiError
  };
};

export default usePlanLimitHandler;
