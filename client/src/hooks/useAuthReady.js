/**
 * Hook para verificar si la autenticación está lista
 * Evita que los módulos hagan peticiones antes de que el token esté disponible
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function useAuthReady() {
  const { isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Si ya está autenticado, está listo inmediatamente
    if (isAuthenticated) {
      setIsReady(true);
      return;
    }

    // Verificar también localStorage como fallback
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsReady(true);
      return;
    }

    // Si no hay autenticación, esperar un momento y verificar de nuevo
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setIsReady(true);
      }
    };

    // Verificar cada 100ms hasta 3 segundos
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      checkAuth();
      if (isReady || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isAuthenticated, isReady]);

  return isReady;
}
