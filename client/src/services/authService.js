/**
 * Auth Service - Autenticación y Sesión
 * PASO 9: Autenticación Reforzada con soporte para Profesionales y Clientes
 */
import { authAPI } from './api';

const authService = {
  /**
   * Login con usuario y contraseña (PASO 9: con remember me)
   */
  login: async (username, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(username, password, rememberMe);
      
      // Si requiere 2FA, devolver sin guardar tokens
      if (response.data?.require2FA) {
        return response.data;
      }
      
      // Guardar tokens y datos del usuario (compatible con ambos: token y accessToken)
      const token = response.data?.token || response.data?.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
      }
      if (response.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      if (response.data?.usuario) {
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      }
      if (response.data?.expiresIn) {
        const expiry = new Date(Date.now() + response.data.expiresIn * 1000);
        localStorage.setItem('tokenExpiry', expiry.toISOString());
      }
      
      return response.data;
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      throw error;
    }
  },

  /**
   * Login específico para profesionales o clientes
   */
  loginEspecifico: async (username, password, rememberMe = false, endpoint = '/auth/login-professional') => {
    try {
      const response = await authAPI.loginSpecific(username, password, rememberMe, endpoint);
      
      if (response.data?.require2FA) {
        return response.data;
      }
      
      const token = response.data?.token || response.data?.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
      }
      if (response.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      if (response.data?.usuario) {
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      }
      if (response.data?.tipoUsuario) {
        localStorage.setItem('tipoUsuario', response.data.tipoUsuario);
      }
      
      return response.data;
    } catch (error) {
      console.error('[AuthService] Specific login error:', error);
      throw error;
    }
  },

  /**
   * Registrar nuevo usuario
   */
  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const token = response.data?.token || response.data?.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
      }
      if (response.data?.usuario) {
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verificar token actual
   */
  verifyToken: async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) return false;
      
      const response = await authAPI.verify();
      return response.data?.success || false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authAPI.logout(refreshToken);
    } catch (error) {
      console.log('[AuthService] Error en logout:', error);
    } finally {
      // Limpiar storage local - Más completo
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authorization');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('rememberMeToken');
    }
    return true;
  },

  /**
   * Obtener usuario actual
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Verificar si está autenticado
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('authorization');
    
    if (!token) return false;
    
    // Verificar expiración si está disponible
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate < new Date()) {
        return false;
      }
    }
    
    return true;
  },

  /**
   * Forgot Password
   */
  forgotPassword: async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset Password
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
