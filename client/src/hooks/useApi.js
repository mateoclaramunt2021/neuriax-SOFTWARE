/**
 * useApi Hook - Fetch de datos con manejo de errores y loading
 */
import { useState, useEffect, useCallback } from 'react';

export function useApi(apiFunction, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    execute();
  }, dependencies);

  const refetch = useCallback(async (...args) => {
    return execute(...args);
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
}
