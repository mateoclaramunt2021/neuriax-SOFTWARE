import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/register.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Paso 1: Datos del negocio
    businessName: '',
    businessType: 'peluqueria',
    phone: '',
    address: '',
    // Paso 2: Datos personales
    ownerName: '',
    username: '',
    email: '',
    // Paso 3: Seguridad
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  // Generar username automáticamente basado en nombre
  const generateUsername = () => {
    if (formData.ownerName && !formData.username) {
      const base = formData.ownerName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 12);
      const random = Math.floor(Math.random() * 999);
      setFormData(prev => ({ ...prev, username: `${base}${random}` }));
    }
  };

  // Validar paso 1
  const validateStep1 = () => {
    if (!formData.businessName.trim()) {
      setError('El nombre del negocio es obligatorio');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('El teléfono es obligatorio');
      return false;
    }
    return true;
  };

  // Validar paso 2
  const validateStep2 = () => {
    if (!formData.ownerName.trim()) {
      setError('Tu nombre es obligatorio');
      return false;
    }
    if (!formData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return false;
    }
    if (formData.username.length < 4) {
      setError('El nombre de usuario debe tener al menos 4 caracteres');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('El nombre de usuario solo puede contener letras, números y guiones bajos');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('El email no es válido');
      return false;
    }
    return true;
  };

  // Validar paso 3
  const validateStep3 = () => {
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/trial/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          phone: formData.phone,
          address: formData.address,
          ownerName: formData.ownerName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          acceptMarketing: formData.acceptMarketing
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      // Guardar token y hacer login
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenantId', data.user.tenantId);

      // Actualizar contexto de autenticación
      loginWithToken(data.token, data.user);

      // Redirigir a configuración del salón
      navigate('/salon-setup', { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <Link to="/" className="register-logo">
          <span className="logo-icon">💈</span>
          <span className="logo-text">GestióPro</span>
        </Link>

        <div className="register-card">
          <div className="register-header">
            <h1>Prueba gratis 7 días</h1>
            <p>Sin tarjeta de crédito · Cancela cuando quieras</p>
          </div>

          {/* Progress Steps */}
          <div className="steps-progress">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number">{step > 1 ? '✓' : '1'}</span>
              <span className="step-label">Negocio</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number">{step > 2 ? '✓' : '2'}</span>
              <span className="step-label">Usuario</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Seguridad</span>
            </div>
          </div>

          {error && (
            <div className="register-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            
            {/* PASO 1: Datos del negocio */}
            {step === 1 && (
              <div className="form-step">
                <h2>Datos de tu negocio</h2>
                
                <div className="form-group">
                  <label htmlFor="businessName">
                    <span className="label-icon">🏪</span>
                    Nombre del negocio *
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Ej: Peluquería María"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">
                    <span className="label-icon">✂️</span>
                    Tipo de negocio
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                  >
                    <option value="peluqueria">Peluquería</option>
                    <option value="barberia">Barbería</option>
                    <option value="salon_belleza">Salón de Belleza</option>
                    <option value="spa">Spa</option>
                    <option value="estetica">Centro de Estética</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <span className="label-icon">📱</span>
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ej: 612345678"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    <span className="label-icon">📍</span>
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Calle, número, ciudad"
                  />
                </div>

                <button 
                  type="button" 
                  className="btn-next"
                  onClick={nextStep}
                >
                  Continuar
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            )}

            {/* PASO 2: Datos personales */}
            {step === 2 && (
              <div className="form-step">
                <h2>Tu cuenta de usuario</h2>
                
                <div className="form-group">
                  <label htmlFor="ownerName">
                    <span className="label-icon">👤</span>
                    Tu nombre completo *
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    onBlur={generateUsername}
                    placeholder="Ej: María García López"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">
                    <span className="label-icon">🔐</span>
                    Nombre de usuario *
                    <small className="label-hint">(para iniciar sesión)</small>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Ej: maria_garcia"
                  />
                  <small className="input-hint">Mínimo 4 caracteres, solo letras, números y _</small>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">✉️</span>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="btn-prev"
                    onClick={prevStep}
                  >
                    <span className="btn-arrow">←</span>
                    Atrás
                  </button>
                  <button 
                    type="button" 
                    className="btn-next"
                    onClick={nextStep}
                  >
                    Continuar
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Contraseña y términos */}
            {step === 3 && (
              <div className="form-step">
                <h2>Seguridad de tu cuenta</h2>
                
                <div className="form-group">
                  <label htmlFor="password">
                    <span className="label-icon">🔒</span>
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <span className="label-icon">🔒</span>
                    Confirmar contraseña *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la contraseña"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      Acepto los <Link to="/terms" target="_blank">términos y condiciones</Link> y la <Link to="/privacy" target="_blank">política de privacidad</Link> *
                    </span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onChange={handleChange}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      Quiero recibir consejos y novedades por email (opcional)
                    </span>
                  </label>
                </div>

                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="btn-prev"
                    onClick={prevStep}
                  >
                    <span className="btn-arrow">←</span>
                    Atrás
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Comenzar prueba gratis
                        <span className="btn-arrow">🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="register-footer">
            <p>
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </div>
        </div>

        <div className="register-benefits">
          <div className="benefit">
            <span className="benefit-icon">✓</span>
            <span>7 días gratis sin compromiso</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">✓</span>
            <span>Sin tarjeta de crédito</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">✓</span>
            <span>Cancela cuando quieras</span>
          </div>
        </div>
      </div>
    </div>
  );
}
