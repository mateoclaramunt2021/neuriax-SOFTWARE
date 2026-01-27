/**
 * Login Premium - Diseño Ultra Moderno
 * Estilo dark con gradientes y efectos glassmorphism
 * PASO 9: Integrado con Remember Me y 2FA
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/login-premium.css';

export default function Login() {
  const navigate = useNavigate();
  const { loginProfessional, verify2FA, cancel2FA, isAuthenticated, usuario } = useAuth();
  const { error: notifyError, success: notifySuccess } = useNotification();

  // Redirigir al dashboard de profesional cuando isAuthenticated sea true
  useEffect(() => {
    if (isAuthenticated) {
      // Este es el login de profesionales, siempre redirigir a dashboard profesional
      navigate('/dashboard/profesional', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // PASO 9: Estado para 2FA
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FAForm, setShow2FAForm] = useState(false);

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
      const response = await loginProfessional(formData.username, formData.password, rememberMe);
      
      // PASO 9: Verificar si requiere 2FA
      if (response && response.require2FA) {
        setShow2FAForm(true);
        setIsLoading(false);
        notifySuccess('Por favor introduce tu código de autenticación');
        return;
      }
      
      if (response && response.success) {
        notifySuccess(`¡Bienvenido, ${response.usuario?.nombre_completo || formData.username}! ✅`);
        // La redirección se hará automáticamente en el useEffect cuando isAuthenticated cambie
      } else {
        // Mostrar intentos restantes si hay bloqueo
        let errorMsg = 'Error en la autenticación';
        if (response?.remainingAttempts !== undefined) {
          errorMsg = `❌ Credenciales incorrectas. ${response.remainingAttempts} intentos restantes`;
        } else if (response?.locked) {
          errorMsg = response?.message || '🔒 Cuenta bloqueada temporalmente';
        } else {
          errorMsg = response?.message || '❌ Credenciales incorrectas';
        }
        setError(errorMsg);
        notifyError(errorMsg);
        setIsLoading(false);
      }
    } catch (err) {
      // PASO 9: Manejar errores de bloqueo y autenticación
      let errorMsg = 'Error al iniciar sesión';
      
      if (err.data?.message) {
        errorMsg = err.data.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      // Añadir iconos según tipo de error
      if (err.response?.status === 423) {
        errorMsg = `🔒 ${errorMsg || 'Cuenta bloqueada temporalmente'}`;
      } else if (err.response?.status === 429) {
        errorMsg = '⏱️ Demasiados intentos. Espera un momento.';
      } else if (err.response?.status === 401) {
        errorMsg = `❌ ${errorMsg || 'Credenciales incorrectas'}`;
      }
      
      setError(errorMsg);
      notifyError(errorMsg);
      console.error('[LoginPro] Auth error:', err);
      setIsLoading(false);
    }
  };

  // PASO 9: Handler para verificar código 2FA
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (twoFactorCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verify2FA(twoFactorCode);
      
      if (response && response.success) {
        notifySuccess(`¡Bienvenido, ${response.usuario?.nombre_completo || formData.username}!`);
        // La redirección se hará automáticamente en el useEffect cuando isAuthenticated cambie
      } else {
        setError(response?.error || 'Código incorrecto');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Código de verificación incorrecto');
      setIsLoading(false);
    }
  };

  // PASO 9: Cancelar 2FA y volver al login
  const handleCancel2FA = () => {
    setShow2FAForm(false);
    setTwoFactorCode('');
    setError('');
    if (cancel2FA) cancel2FA();
  };

  return (
    <div className="login-premium">
      <div className="login-premium-container">
        
        {/* PANEL IZQUIERDO - BRANDING */}
        <div className="login-brand-panel">
          <div className="brand-content">
            
            {/* Logo */}
            <div className="brand-logo">
              <div className="brand-icon">💈</div>
              <div className="brand-text">
                <h1>NEURIAX</h1>
                <p>Salon Manager</p>
              </div>
            </div>

            {/* Headline */}
            <div className="brand-headline">
              <h2>
                Gestiona tu salón<br/>
                <span>como un profesional</span>
              </h2>
              <p>
                La plataforma todo-en-uno para llevar tu negocio 
                al siguiente nivel con herramientas inteligentes.
              </p>
            </div>

            {/* Features Grid */}
            <div className="brand-features">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h4>Dashboard Inteligente</h4>
                <p>Analítica en tiempo real</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h4>Agenda Smart</h4>
                <p>Gestión de citas 24/7</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💳</div>
                <h4>POS Integrado</h4>
                <p>Cobros rápidos y seguros</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h4>CRM Avanzado</h4>
                <p>Conoce a tus clientes</p>
              </div>
            </div>

          </div>
        </div>

        {/* PANEL DERECHO - FORM */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            
            {/* Header */}
            <div className="form-header">
              <h2>{show2FAForm ? 'Verificación 2FA' : 'Iniciar Sesión'}</h2>
              <p>{show2FAForm ? 'Introduce el código de tu app de autenticación' : 'Ingresa tus credenciales para continuar'}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message-premium">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* PASO 9: Formulario 2FA */}
            {show2FAForm ? (
              <form onSubmit={handle2FASubmit} className="login-form-premium">
                <div className="form-group-premium">
                  <label className="form-label-premium">Código de Verificación</label>
                  <div className="input-container">
                    <span className="input-icon-premium">🔐</span>
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="form-input-premium twofa-input"
                      disabled={isLoading}
                      autoComplete="one-time-code"
                      autoFocus
                      maxLength={6}
                    />
                  </div>
                  <p className="form-hint">Abre Google Authenticator y copia el código de 6 dígitos</p>
                </div>

                <button 
                  type="submit" 
                  className={`submit-btn-premium ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || twoFactorCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="btn-back-login"
                  onClick={handleCancel2FA}
                  disabled={isLoading}
                >
                  ← Volver al login
                </button>
              </form>
            ) : (
              /* Form Normal */
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

                {/* Actions Row - PASO 9: Remember Me conectado */}
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
            )}

            {/* Divider */}
            <div className="divider-premium">
              <span>Demo</span>
            </div>

            {/* Demo Credentials */}
            <div className="demo-card-premium">
              <p className="demo-title-premium">
                <span>🔑</span>
                Credenciales de prueba
              </p>
              <div className="demo-credentials">
                <div className="credential-item">
                  <span className="credential-label">Usuario</span>
                  <span className="credential-value">admin</span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Contraseña</span>
                  <span className="credential-value">admin123</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="form-footer-premium">
              <p>
                ¿No tienes cuenta? <a href="/">Ver planes disponibles</a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
