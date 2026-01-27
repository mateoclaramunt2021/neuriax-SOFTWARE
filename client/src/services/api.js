/**
 * API Client - Configuración centralizada de llamadas API
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Función base para hacer peticiones
 */
const request = async (endpoint, options = {}) => {
  // Obtener token de cualquiera de las posibles localizaciones
  const token = localStorage.getItem('accessToken') || 
                localStorage.getItem('token') ||
                localStorage.getItem('authorization');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`);
    error.response = response;
    error.data = data;
    throw error;
  }

  return { data, status: response.status };
};

/**
 * Auth API
 */
export const authAPI = {
  login: (username, password, rememberMe = false) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, rememberMe }),
    }),

  loginSpecific: (username, password, rememberMe = false, endpoint = '/auth/login-professional') =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ username, password, rememberMe }),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tipoUsuario');
  },

  verify: () =>
    request('/auth/verify', { method: 'GET' }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    }),
};

/**
 * Generic API methods
 */
export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
