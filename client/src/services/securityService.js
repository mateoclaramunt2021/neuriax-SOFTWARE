/**
 * NEURIAX SaaS Platform - Servicio de Seguridad Frontend
 * PASO 9: Autenticación Reforzada
 */

import apiService from './apiService';

// Alias para compatibilidad
const api = apiService;

// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const STORAGE_KEYS = {
  REMEMBER_ME_TOKEN: 'neuriax_remember_me',
  ACCESS_TOKEN: 'accessToken',  // Unificado con api.js y apiService.js
  REFRESH_TOKEN: 'refreshToken',
  USER: 'usuario',
  TOKEN_EXPIRY: 'tokenExpiry'
};

// ==========================================================
// REMEMBER ME
// ==========================================================

/**
 * Guardar token de Remember Me
 */
export const saveRememberMeToken = (token, expiresInSeconds) => {
  if (!token) return;
  
  const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);
  localStorage.setItem(STORAGE_KEYS.REMEMBER_ME_TOKEN, JSON.stringify({
    token,
    expiresAt: expiryDate.toISOString()
  }));
};

/**
 * Obtener token de Remember Me
 */
export const getRememberMeToken = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME_TOKEN);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    const expiresAt = new Date(parsed.expiresAt);
    
    if (expiresAt < new Date()) {
      clearRememberMeToken();
      return null;
    }
    
    return parsed.token;
  } catch {
    return null;
  }
};

/**
 * Limpiar token de Remember Me
 */
export const clearRememberMeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_TOKEN);
};

/**
 * Login automático con Remember Me
 */
export const loginWithRememberMe = async () => {
  const rememberMeToken = getRememberMeToken();
  if (!rememberMeToken) {
    return { success: false, error: 'No remember me token' };
  }
  
  try {
    const response = await api.post('/auth/login-remember', { rememberMeToken });
    return response.data;
  } catch (error) {
    clearRememberMeToken();
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error en login automático' 
    };
  }
};

// ==========================================================
// 2FA
// ==========================================================

/**
 * Configurar 2FA
 */
export const setup2FA = async () => {
  try {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error configurando 2FA' 
    };
  }
};

/**
 * Verificar y habilitar 2FA
 */
export const enable2FA = async (code) => {
  try {
    const response = await api.post('/auth/2fa/enable', { code });
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error habilitando 2FA' 
    };
  }
};

/**
 * Deshabilitar 2FA
 */
export const disable2FA = async (password) => {
  try {
    const response = await api.post('/auth/2fa/disable', { password });
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error deshabilitando 2FA' 
    };
  }
};

/**
 * Obtener estado de 2FA
 */
export const get2FAStatus = async () => {
  try {
    const response = await api.get('/auth/2fa/status');
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error obteniendo estado 2FA' 
    };
  }
};

/**
 * Verificar código 2FA durante login
 */
export const verify2FA = async (tempToken, code) => {
  try {
    const response = await api.post('/auth/verify-2fa', { tempToken, code });
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Código incorrecto' 
    };
  }
};

// ==========================================================
// SESIONES
// ==========================================================

/**
 * Obtener sesiones activas
 */
export const getActiveSessions = async () => {
  try {
    const response = await api.get('/auth/security/sessions');
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error obteniendo sesiones' 
    };
  }
};

/**
 * Cerrar todas las sesiones
 */
export const logoutAllSessions = async () => {
  try {
    const response = await api.post('/auth/security/logout-all');
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error cerrando sesiones' 
    };
  }
};

/**
 * Obtener estadísticas de seguridad
 */
export const getSecurityStats = async () => {
  try {
    const response = await api.get('/auth/security/stats');
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error obteniendo estadísticas' 
    };
  }
};

// ==========================================================
// CONTRASEÑA
// ==========================================================

/**
 * Cambiar contraseña
 */
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await api.post('/auth/security/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error cambiando contraseña' 
    };
  }
};

// ==========================================================
// TOKEN MANAGEMENT
// ==========================================================

/**
 * Guardar tokens después de login
 */
export const saveAuthTokens = (data) => {
  const token = data.token || data.accessToken;
  if (token) {
    // Guardar en ambas keys para compatibilidad
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem('token', token); // Backward compatibility
  }
  if (data.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  }
  if (data.usuario) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.usuario));
  }
  if (data.expiresIn) {
    const expiry = new Date(Date.now() + data.expiresIn * 1000);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toISOString());
  }
  if (data.rememberMeToken && data.rememberMeExpiresIn) {
    saveRememberMeToken(data.rememberMeToken, data.rememberMeExpiresIn);
  }
};

/**
 * Limpiar todos los tokens
 */
export const clearAllTokens = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Verificar si el token está próximo a expirar
 */
export const isTokenExpiringSoon = (marginSeconds = 60) => {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  
  const expiryDate = new Date(expiry);
  const margin = marginSeconds * 1000;
  
  return expiryDate.getTime() - Date.now() < margin;
};

/**
 * Refrescar token si está próximo a expirar
 */
export const refreshTokenIfNeeded = async () => {
  if (!isTokenExpiringSoon()) {
    return { success: true, refreshed: false };
  }
  
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    return { success: false, error: 'No refresh token' };
  }
  
  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    if (response.data.success) {
      saveAuthTokens(response.data);
      return { success: true, refreshed: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error refrescando token' 
    };
  }
};

// ==========================================================
// UTILIDADES
// ==========================================================

/**
 * Formatear información de dispositivo
 */
export const formatDeviceInfo = (deviceInfo) => {
  if (!deviceInfo) return 'Dispositivo desconocido';
  return `${deviceInfo.browser || 'Navegador'} en ${deviceInfo.os || 'OS'}`;
};

/**
 * Formatear fecha relativa
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Desconocido';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `Hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 7) return `Hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString();
};

const securityService = {
  // Remember Me
  saveRememberMeToken,
  getRememberMeToken,
  clearRememberMeToken,
  loginWithRememberMe,
  
  // 2FA
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
  verify2FA,
  
  // Sesiones
  getActiveSessions,
  logoutAllSessions,
  getSecurityStats,
  
  // Contraseña
  changePassword,
  
  // Token Management
  saveAuthTokens,
  clearAllTokens,
  isTokenExpiringSoon,
  refreshTokenIfNeeded,
  
  // Utilidades
  formatDeviceInfo,
  formatRelativeTime,
  
  // Constants
  STORAGE_KEYS
};

export default securityService;
