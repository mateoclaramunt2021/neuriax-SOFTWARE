import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './RegisterClientForm.css';

const RegisterClientForm = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
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

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Usar el nuevo endpoint de registro para clientes
      const response = await fetch('http://localhost:3001/api/auth/register-client-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
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
        localStorage.setItem('tipoUsuario', 'cliente');
        
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        if (data.usuario) {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
        }

        // Notificar éxito
        notifySuccess('¡Bienvenido! Cuenta creada exitosamente. ✅');
        
        // Usar loginWithToken para actualizar el contexto
        if (loginWithToken && data.usuario) {
          loginWithToken(token, data.usuario);
        }
        
        // Redirigir al dashboard de cliente
        setTimeout(() => {
          navigate('/dashboard/cliente', { replace: true });
        }, 1000);
      }

    } catch (err) {
      const errorMsg = err.message || 'Error al registrar. Intenta de nuevo.';
      setError(errorMsg);
      notifyError(errorMsg);
      console.error('[RegisterClientForm] Error:', err);
      setLoading(false);
    }
  };

  const handleBackToChoice = () => {
    navigate('/register');
  };

  return (
    <div className="register-client-container">
      <div className="register-client-card">
        <div className="register-client-header">
          <button className="back-btn" onClick={handleBackToChoice}>
            ← Atrás
          </button>
          <h1>Crear Cuenta de Cliente</h1>
          <p>Accede a miles de salones y reserva tu cita</p>
        </div>

        <form className="register-client-form" onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
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
        </form>

        <div className="register-client-footer">
          <p>¿Ya tienes cuenta? <button className="link-btn" onClick={() => navigate('/login')}>Inicia sesión</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterClientForm;
