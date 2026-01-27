/* ========================================
   NEURIAX SALON MANAGER v2.0
   useFetch Hook
   Hook personalizado para data fetching
   ======================================== */

import { useState, useCallback, useEffect } from 'react';
import { errorLogger } from '../utils/errorLogger';
import apiService from '../services/apiService';

/**
 * Hook para fetching de datos
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.get(url);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
        errorLogger.warn(`Fetch failed: ${url}`, result.error);
      }
    } catch (err) {
      setError(err.message);
      errorLogger.error(`Fetch error: ${url}`, err);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options.skip) return;
    fetchData();

    if (options.interval) {
      const intervalId = setInterval(fetchData, options.interval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, options.skip, options.interval]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

/**
 * Hook para POST/mutation
 */
export const useMutation = (method = 'POST') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(
    async (url, payload) => {
      setLoading(true);
      setError(null);

      try {
        let result;

        if (method === 'POST') {
          result = await apiService.post(url, payload);
        } else if (method === 'PUT') {
          result = await apiService.put(url, payload);
        } else if (method === 'PATCH') {
          result = await apiService.patch(url, payload);
        } else if (method === 'DELETE') {
          result = await apiService.delete(url);
        }

        if (result.success) {
          setData(result.data);
          return { success: true, data: result.data };
        } else {
          setError(result.error);
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        errorLogger.error(`Mutation error: ${url}`, err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [method]
  );

  return { mutate, loading, error, data };
};

/**
 * Hook para GET con paginación
 */
export const usePaginatedFetch = (baseUrl, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError(null);

      try {
        const url = `${baseUrl}?page=${pageNum}&limit=${pageSize}`;
        const result = await apiService.get(url);

        if (result.success) {
          if (pageNum === 1) {
            setData(result.data);
          } else {
            setData((prev) => [...prev, ...result.data]);
          }
          setHasMore(result.data.length === pageSize);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
        errorLogger.error(`Paginated fetch error: ${baseUrl}`, err);
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, pageSize]
  );

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage);
  }, [page, fetchPage]);

  const reset = useCallback(() => {
    setPage(1);
    setData([]);
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(1);
  }, [baseUrl]);

  return { data, loading, error, page, hasMore, loadMore, reset };
};

/**
 * Hook para buscar/filtrar con debounce
 */
export const useSearch = (searchFn, delay = 500) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() === '') {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const result = await searchFn(query);
        setResults(result.data || []);
      } catch (error) {
        errorLogger.error('Search error', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, searchFn, delay]);

  return { query, setQuery, results, searching };
};

/**
 * Hook para caché de datos
 */
export const useCachedFetch = (url, ttl = 5 * 60 * 1000) => {
  const cacheRef = {};

  return useCallback(async () => {
    const now = Date.now();
    const cached = cacheRef[url];

    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    const result = await apiService.get(url);

    if (result.success) {
      cacheRef[url] = {
        data: result.data,
        timestamp: now,
      };
      return result.data;
    }

    return null;
  }, [url, ttl]);
};

/**
 * Hook para sincronización automática
 */
export const useSyncData = (url, interval = 30000) => {
  const [data, setData] = useState(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const result = await apiService.get(url);
      if (result.success) {
        setData(result.data);
        setSynced(true);
      }
    };

    sync();
    const intervalId = setInterval(sync, interval);

    return () => clearInterval(intervalId);
  }, [url, interval]);

  return { data, synced };
};

export default useFetch;
