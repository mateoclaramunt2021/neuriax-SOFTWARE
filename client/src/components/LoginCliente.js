/**
 * Login Cliente - Diseño Premium (MISMO ESTILO QUE LoginPro.js)
 * Para clientes que buscan salones y hacen reservas
 * Usa loginClient() del AuthContext
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/login-premium.css';

export default function LoginCliente() {
  const navigate = useNavigate();
  const { loginClient, isAuthenticated } = useAuth();
  const { error: notifyError, success: notifySuccess } = useNotification();

  // Redirigir al dashboard cliente cuando isAuthenticated sea true
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard/cliente', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (formData.username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginClient(formData.username, formData.password, rememberMe);
      
      if (response && response.success) {
        notifySuccess(`¡Bienvenido, ${response.usuario?.nombre_completo || formData.username}! ✅`);
        // La redirección se hará automáticamente en el useEffect cuando isAuthenticated cambie
      } else {
        let errorMsg = 'Error en la autenticación';
        if (response?.message) {
          errorMsg = response.message;
        }
        setError(`❌ ${errorMsg}`);
        notifyError(errorMsg);
        setIsLoading(false);
      }
    } catch (err) {
      let errorMsg = 'Error al iniciar sesión';
      
      if (err.data?.message) {
        errorMsg = err.data.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      if (err.response?.status === 401) {
        errorMsg = `❌ Credenciales incorrectas`;
      }
      
      setError(errorMsg);
      notifyError(errorMsg);
      console.error('[LoginCliente] Auth error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-premium">
      <div className="login-premium-container">
        
        {/* PANEL IZQUIERDO - BRANDING */}
        <div className="login-brand-panel">
          <div className="brand-content">
            
            {/* Logo */}
            <div className="brand-logo">
              <div className="brand-icon">✨</div>
              <div className="brand-text">
                <h1>NEURIAX</h1>
                <p>Encuentra tu Salón</p>
              </div>
            </div>

            {/* Headline */}
            <div className="brand-headline">
              <h2>
                Descubre los mejores<br/>
                <span>salones de belleza</span>
              </h2>
              <p>
                Reserva tus servicios de belleza de forma fácil y rápida
                en los mejores salones de tu ciudad.
              </p>
            </div>

            {/* Features Grid */}
            <div className="brand-features">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h4>Busca Salones</h4>
                <p>Encuentra los mejores cerca de ti</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h4>Reserva Online</h4>
                <p>Agenda tus citas al instante</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h4>Valoraciones</h4>
                <p>Lee opiniones de otros clientes</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h4>Ofertas Especiales</h4>
                <p>Acceso a promociones exclusivas</p>
              </div>
            </div>

          </div>
        </div>

        {/* PANEL DERECHO - FORM */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            
            {/* Header */}
            <div className="form-header">
              <h2>Iniciar Sesión</h2>
              <p>Accede a tu cuenta de cliente para reservar servicios</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message-premium">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form-premium">
              
              {/* Username */}
              <div className="form-group-premium">
                <label className="form-label-premium">Usuario o Email</label>
                <div className="input-container">
                  <span className="input-icon-premium">👤</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Ingresa tu usuario"
                    className="form-input-premium"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group-premium">
                <label className="form-label-premium">Contraseña</label>
                <div className="input-container">
                  <span className="input-icon-premium">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input-premium"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password-premium"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Actions Row */}
              <div className="form-actions-premium">
                <label className="remember-premium">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="checkbox-custom"></div>
                  <span>Recuérdame 30 días</span>
                </label>
                <a href="/forgot-password" className="forgot-link-premium">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="submit-btn-premium"
                disabled={isLoading}
              >
                <div className="btn-content">
                  {isLoading ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <span>→</span>
                    </>
                  )}
                </div>
              </button>

            </form>

            {/* Divider */}
            <div className="divider-premium">
              <span>📱 DEMO</span>
            </div>

            {/* Demo Instructions */}
            <div className="demo-card-premium">
              <p className="demo-title-premium">
                <span>🚀</span>
                Cómo usar la DEMO
              </p>
              <div className="demo-credentials">
                <div className="credential-item">
                  <span className="credential-label">1️⃣ Inicia sesión</span>
                  <span className="credential-value">Usuario: demo | Pass: admin123</span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">2️⃣ Explora el Dashboard</span>
                  <span className="credential-value">✓ Servicios • Reservas • Historial</span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">3️⃣ Prueba las funciones</span>
                  <span className="credential-value">✓ 1 año de datos ficticios incluidos</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="form-footer-premium">
              <p>
                ¿No tienes cuenta? <a href="/">Regístrate aquí</a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
