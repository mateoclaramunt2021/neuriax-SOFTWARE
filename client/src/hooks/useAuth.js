/**
 * NEURIAX SaaS Platform - Hook de Autenticación Mejorado
 * PASO 9: Autenticación Reforzada
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';
import securityService from '../services/securityService';

// Intervalo de refresh de tokens (10 minutos)
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000;

export const useAuth = () => {
  const [usuario, setUsuario] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  
  const refreshIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Actualizar última actividad
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Auto-refresh de tokens
  const startTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(async () => {
      // Solo refrescar si hay actividad reciente (últimos 30 minutos)
      const inactivityTime = Date.now() - lastActivityRef.current;
      if (inactivityTime > 30 * 60 * 1000) {
        console.log('[Auth] Usuario inactivo, no se refresca token');
        return;
      }

      const result = await securityService.refreshTokenIfNeeded();
      if (result.refreshed) {
        console.log('[Auth] Token refrescado automáticamente');
      } else if (!result.success) {
        console.log('[Auth] Error al refrescar token:', result.error);
        // Si hay error de refresh, verificar si la sesión sigue válida
        const isValid = await authService.verifyToken();
        if (!isValid) {
          handleLogout();
        }
      }
    }, TOKEN_REFRESH_INTERVAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    const initAuth = async () => {
      setCargando(true);
      
      // Primero intentar con token existente
      const user = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();
      
      if (isAuth && user) {
        setUsuario(user);
        setIsAuthenticated(true);
        startTokenRefresh();
        setCargando(false);
        return;
      }

      // Si no hay sesión, intentar remember me
      const rememberMeToken = securityService.getRememberMeToken();
      if (rememberMeToken) {
        try {
          const result = await securityService.loginWithRememberMe();
          if (result.success) {
            if (result.require2FA) {
              setRequire2FA(true);
              setTempToken(result.tempToken);
            } else {
              securityService.saveAuthTokens(result);
              setUsuario(result.usuario);
              setIsAuthenticated(true);
              startTokenRefresh();
            }
          }
        } catch (error) {
          console.log('[Auth] Remember me login failed:', error);
          securityService.clearRememberMeToken();
        }
      }

      setCargando(false);
    };

    initAuth();

    // Listener de actividad
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      stopTokenRefresh();
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [startTokenRefresh, stopTokenRefresh, updateActivity]);

  // Login mejorado con remember me
  const login = useCallback(async (username, password, rememberMe = false) => {
    setCargando(true);
    setRequire2FA(false);
    setTempToken(null);

    try {
      const response = await authService.login(username, password, rememberMe);
      
      // Si requiere 2FA
      if (response.require2FA) {
        setRequire2FA(true);
        setTempToken(response.tempToken);
        setCargando(false);
        return { success: true, require2FA: true };
      }

      // Login completo
      securityService.saveAuthTokens(response);
      setUsuario(response.usuario);
      setIsAuthenticated(true);
      startTokenRefresh();
      
      return { success: true, usuario: response.usuario };
    } catch (error) {
      setIsAuthenticated(false);
      setUsuario(null);
      throw error;
    } finally {
      setCargando(false);
    }
  }, [startTokenRefresh]);

  // Verificar 2FA
  const verify2FA = useCallback(async (code) => {
    if (!tempToken) {
      throw new Error('No hay sesión de 2FA pendiente');
    }

    setCargando(true);
    try {
      const result = await securityService.verify2FA(tempToken, code);
      
      if (result.success) {
        securityService.saveAuthTokens(result);
        setUsuario(result.usuario);
        setIsAuthenticated(true);
        setRequire2FA(false);
        setTempToken(null);
        startTokenRefresh();
        return { success: true, usuario: result.usuario };
      }
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setCargando(false);
    }
  }, [tempToken, startTokenRefresh]);

  // Cancelar 2FA
  const cancel2FA = useCallback(() => {
    setRequire2FA(false);
    setTempToken(null);
  }, []);

  // Logout mejorado
  const handleLogout = useCallback(async (logoutAllDevices = false) => {
    setCargando(true);
    stopTokenRefresh();

    try {
      if (logoutAllDevices) {
        await securityService.logoutAllSessions();
      } else {
        await authService.logout();
      }
      
      securityService.clearAllTokens();
    } catch (error) {
      console.error('[Auth] Error en logout:', error);
    } finally {
      setUsuario(null);
      setIsAuthenticated(false);
      setRequire2FA(false);
      setTempToken(null);
      setCargando(false);
    }
  }, [stopTokenRefresh]);

  // Register
  const register = useCallback(async (userData) => {
    setCargando(true);
    try {
      const response = await authService.register(userData);
      if (response.success) {
        securityService.saveAuthTokens(response);
        setUsuario(response.usuario);
        setIsAuthenticated(true);
        startTokenRefresh();
      }
      return response;
    } finally {
      setCargando(false);
    }
  }, [startTokenRefresh]);

  // Obtener sesiones activas
  const getSessions = useCallback(async () => {
    const result = await securityService.getActiveSessions();
    if (result.success) {
      const total = (result.sessions?.active?.length || 0) + (result.sessions?.rememberMe?.length || 0);
      setSessionCount(total);
    }
    return result;
  }, []);

  // Verificar si tiene 2FA habilitado
  const check2FAStatus = useCallback(async () => {
    return await securityService.get2FAStatus();
  }, []);

  // Refrescar datos del usuario
  const refreshUser = useCallback(async () => {
    const isValid = await authService.verifyToken();
    if (isValid) {
      const user = authService.getCurrentUser();
      setUsuario(user);
    }
    return isValid;
  }, []);

  return {
    // Estado
    usuario,
    isAuthenticated,
    cargando,
    require2FA,
    sessionCount,
    
    // Acciones de auth
    login,
    logout: handleLogout,
    register,
    
    // 2FA
    verify2FA,
    cancel2FA,
    check2FAStatus,
    
    // Sesiones
    getSessions,
    logoutAllDevices: () => handleLogout(true),
    
    // Utilidades
    refreshUser,
    updateActivity
  };
};

export default useAuth;
