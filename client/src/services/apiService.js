/* ========================================
   NEURIAX SALON MANAGER v2.0
   API Service - Servicio centralizado
   ======================================== */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const TIMEOUT = 30000;

/**
 * Clase principal de API Service
 */
class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = TIMEOUT;
  }

  /**
   * Obtener headers con token de autenticación
   */
  getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  /**
   * Manejar respuesta de la API
   */
  handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      // No eliminar tokens automáticamente en 401 - puede ser timing issue
      // El AuthContext manejará la expiración real del token
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  };

  /**
   * GET request
   */
  get = async (endpoint) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await this.handleResponse(response);
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API GET ERROR] ${endpoint}`, error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  };

  /**
   * POST request
   */
  post = async (endpoint, body) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await this.handleResponse(response);
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API POST ERROR] ${endpoint}`, error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  };

  /**
   * PUT request
   */
  put = async (endpoint, body) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await this.handleResponse(response);
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API PUT ERROR] ${endpoint}`, error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  };

  /**
   * DELETE request
   */
  delete = async (endpoint) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await this.handleResponse(response);
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API DELETE ERROR] ${endpoint}`, error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  };
}

export const apiService = new APIService();
export default apiService;
