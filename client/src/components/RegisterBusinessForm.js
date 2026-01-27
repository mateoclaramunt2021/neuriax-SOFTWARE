import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './RegisterBusinessForm.css';

const RegisterBusinessForm = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    nombreDueno: '',
    email: '',
    telefono: '',
    password: '',
    passwordConfirm: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.nombreEmpresa.trim()) {
      setError('El nombre de la empresa es requerido');
      return false;
    }
    if (!formData.nombreDueno.trim()) {
      setError('Tu nombre es requerido');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email inválido');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    try {
      // Usar el nuevo endpoint para registro de profesionales
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/auth/register-professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombreEmpresa: formData.nombreEmpresa,
          nombreDueno: formData.nombreDueno,
          email: formData.email,
          telefono: formData.telefono,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Error en el registro';
        setError(errorMsg);
        notifyError(errorMsg);
        setLoading(false);
        return;
      }

      // Guardar datos de autenticación
      if (data.token || data.accessToken) {
        const token = data.token || data.accessToken;
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('tipoUsuario', 'profesional');
        
        // Guardar tenantId si viene
        if (data.tenantId) {
          localStorage.setItem('tenantId', data.tenantId);
        }
        
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        if (data.usuario) {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
        }

        notifySuccess('¡Bienvenido! Cuenta de profesional creada exitosamente. ✅');
        
        // Usar loginWithToken para actualizar el contexto
        if (loginWithToken && data.usuario) {
          loginWithToken(token, data.usuario);
        }
        
        // Redirigir al dashboard profesional (o setup si es primera vez)
        setTimeout(() => {
          if (data.firstTime) {
            navigate('/salon-setup', { 
              replace: true,
              state: { 
                firstTime: true, 
                tenantId: data.tenantId || data.usuario?.tenant_id 
              } 
            });
          } else {
            navigate('/dashboard/profesional', { replace: true });
          }
        }, 1000);
      }

    } catch (err) {
      const errorMsg = err.message || 'Error al registrar. Intenta de nuevo.';
      setError(errorMsg);
      notifyError(errorMsg);
      console.error('[RegisterBusinessForm] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToChoice = () => {
    if (step === 2) {
      setStep(1);
      setError('');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="register-business-container">
      <div className="register-business-card">
        <div className="register-business-header">
          <button className="back-btn" onClick={handleBackToChoice}>
            ← Atrás
          </button>
          <h1>Crear Cuenta de Profesional</h1>
          <p>Gestiona tu negocio con nuestro sistema completo</p>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Datos Empresa</div>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Seguridad</div>
          </div>
        </div>

        <form className="register-business-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label htmlFor="nombreEmpresa">Nombre de la Empresa</label>
                <input
                  id="nombreEmpresa"
                  type="text"
                  name="nombreEmpresa"
                  value={formData.nombreEmpresa}
                  onChange={handleChange}
                  placeholder="Mi Salón Premium"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombreDueno">Tu Nombre Completo</label>
                <input
                  id="nombreDueno"
                  type="text"
                  name="nombreDueno"
                  value={formData.nombreDueno}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono (Opcional)</label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  disabled={loading}
                />
              </div>

              <button 
                type="button" 
                className="next-btn"
                onClick={handleNextStep}
                disabled={loading}
              >
                Siguiente →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@empresa.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="passwordConfirm">Confirmar Contraseña</label>
                <input
                  id="passwordConfirm"
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="Confirma tu contraseña"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="register-btn"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </div>
          )}
        </form>

        <div className="register-business-footer">
          <p>¿Ya tienes cuenta? <button className="link-btn" onClick={() => navigate('/login')}>Inicia sesión</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterBusinessForm;
