import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nueva contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Paso 1: Enviar email para recibir código
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Se ha enviado un código de verificación a tu email');
        setStep(2);
        // En desarrollo, mostrar el código
        if (data._dev_reset_code) {
          console.log('Código de desarrollo:', data._dev_reset_code);
          setSuccess(`Código enviado. En desarrollo: ${data._dev_reset_code}`);
        }
      } else {
        setError(data.message || 'Error al enviar el código');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Código verificado correctamente');
        setStep(3);
      } else {
        setError(data.message || 'Código inválido o expirado');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Cambiar contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('¡Contraseña actualizada correctamente!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="forgot-password-page">
      {/* Fondo animado */}
      <div className="forgot-bg-animation">
        <div className="forgot-gradient-orb forgot-orb-1"></div>
        <div className="forgot-gradient-orb forgot-orb-2"></div>
        <div className="forgot-gradient-orb forgot-orb-3"></div>
      </div>

      <div className="forgot-container">
        {/* Logo y título */}
        <div className="forgot-header">
          <Link to="/" className="forgot-logo">
            <span className="forgot-logo-icon">✂️</span>
            <span className="forgot-logo-text">NEURIAX</span>
          </Link>
          <h1 className="forgot-title">Recuperar Contraseña</h1>
          <p className="forgot-subtitle">
            {step === 1 && 'Ingresa tu email para recibir un código de verificación'}
            {step === 2 && 'Ingresa el código de 6 dígitos que enviamos a tu email'}
            {step === 3 && 'Crea tu nueva contraseña'}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="forgot-steps">
          <div className={`forgot-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="forgot-step-number">{step > 1 ? '✓' : '1'}</div>
            <span>Email</span>
          </div>
          <div className="forgot-step-line"></div>
          <div className={`forgot-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="forgot-step-number">{step > 2 ? '✓' : '2'}</div>
            <span>Código</span>
          </div>
          <div className="forgot-step-line"></div>
          <div className={`forgot-step ${step >= 3 ? 'active' : ''}`}>
            <div className="forgot-step-number">3</div>
            <span>Nueva Contraseña</span>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="forgot-message forgot-error">
            <span className="forgot-message-icon">⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className="forgot-message forgot-success">
            <span className="forgot-message-icon">✅</span>
            {success}
          </div>
        )}

        {/* Formularios por paso */}
        <div className="forgot-form-container">
          {/* Paso 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="forgot-form">
              <div className="forgot-input-group">
                <label htmlFor="email">Correo Electrónico</label>
                <div className="forgot-input-wrapper">
                  <span className="forgot-input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? (
                  <span className="forgot-btn-loading">
                    <span className="forgot-spinner"></span>
                    Enviando...
                  </span>
                ) : (
                  <>
                    <span>Enviar Código</span>
                    <span className="forgot-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Paso 2: Código de verificación */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="forgot-form">
              <div className="forgot-input-group">
                <label htmlFor="code">Código de Verificación</label>
                <div className="forgot-code-input-container">
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="000000"
                    maxLength={6}
                    className="forgot-code-input"
                    autoFocus
                  />
                </div>
                <p className="forgot-code-hint">Revisa tu bandeja de entrada y spam</p>
              </div>
              <button type="submit" className="forgot-btn" disabled={loading || code.length !== 6}>
                {loading ? (
                  <span className="forgot-btn-loading">
                    <span className="forgot-spinner"></span>
                    Verificando...
                  </span>
                ) : (
                  <>
                    <span>Verificar Código</span>
                    <span className="forgot-btn-arrow">→</span>
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="forgot-resend-btn"
                onClick={handleSendCode}
                disabled={loading}
              >
                ¿No recibiste el código? Reenviar
              </button>
            </form>
          )}

          {/* Paso 3: Nueva contraseña */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="forgot-form">
              <div className="forgot-input-group">
                <label htmlFor="newPassword">Nueva Contraseña</label>
                <div className="forgot-input-wrapper">
                  <span className="forgot-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="forgot-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="forgot-input-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <div className="forgot-input-wrapper">
                  <span className="forgot-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              {/* Indicador de fortaleza */}
              <div className="forgot-password-strength">
                <div className={`forgot-strength-bar ${newPassword.length >= 6 ? 'weak' : ''} ${newPassword.length >= 8 ? 'medium' : ''} ${newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'strong' : ''}`}></div>
                <span className="forgot-strength-text">
                  {newPassword.length === 0 && 'Ingresa una contraseña'}
                  {newPassword.length > 0 && newPassword.length < 6 && 'Muy corta'}
                  {newPassword.length >= 6 && newPassword.length < 8 && 'Débil'}
                  {newPassword.length >= 8 && newPassword.length < 10 && 'Media'}
                  {newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && 'Fuerte'}
                </span>
              </div>

              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? (
                  <span className="forgot-btn-loading">
                    <span className="forgot-spinner"></span>
                    Actualizando...
                  </span>
                ) : (
                  <>
                    <span>Cambiar Contraseña</span>
                    <span className="forgot-btn-arrow">✓</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Volver al login */}
        <div className="forgot-footer">
          <Link to="/login" className="forgot-back-link">
            <span>←</span> Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
