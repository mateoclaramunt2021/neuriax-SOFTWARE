/**
 * UserProfileModal - Modal de Perfil de Usuario
 * Ver/editar perfil, cambiar contraseña, estadísticas
 */
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import '../../styles/profile-modal.css';

export default function UserProfileModal({ isOpen, onClose, usuario }) {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    ventasHoy: 0,
    citasHoy: 0,
    clientesAtendidos: 0,
    ingresosMes: 0
  });

  // Formulario de perfil
  const [profileData, setProfileData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    avatar: ''
  });

  // Formulario de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && usuario) {
      setProfileData({
        nombre_completo: usuario.nombre_completo || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        avatar: usuario.avatar || ''
      });
      fetchStats();
    }
  }, [isOpen, usuario]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/reportes/resumen');
      if (res.data.success) {
        setStats({
          ventasHoy: res.data.resumen?.ventasHoy || 0,
          citasHoy: res.data.resumen?.citasHoy || 0,
          clientesAtendidos: res.data.resumen?.clientesAtendidos || 0,
          ingresosMes: res.data.resumen?.ingresosMes || 0
        });
      }
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        notifySuccess('Perfil actualizado correctamente');
        // Actualizar localStorage si es necesario
        const storedUser = JSON.parse(localStorage.getItem('usuario') || '{}');
        localStorage.setItem('usuario', JSON.stringify({ ...storedUser, ...profileData }));
      } else {
        notifyError(res.data.message || 'Error al actualizar perfil');
      }
    } catch (err) {
      notifyError('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notifyError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      notifyError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (res.data.success) {
        notifySuccess('Contraseña cambiada correctamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        notifyError(res.data.message || 'Error al cambiar contraseña');
      }
    } catch (err) {
      notifyError('Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (rol) => {
    const roles = {
      administrador: { label: 'Administrador', class: 'badge-admin' },
      admin: { label: 'Admin', class: 'badge-admin' },
      empleado: { label: 'Empleado', class: 'badge-empleado' },
      recepcionista: { label: 'Recepcionista', class: 'badge-recepcion' }
    };
    return roles[rol] || { label: rol, class: 'badge-default' };
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    { id: 'stats', label: 'Estadísticas', icon: '📊' },
    { id: 'preferences', label: 'Preferencias', icon: '⚙️' }
  ];

  const role = getRoleBadge(usuario?.rol);

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-header-info">
            <div className="profile-avatar">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" />
              ) : (
                <span className="avatar-initials">{getInitials(profileData.nombre_completo)}</span>
              )}
              <button className="avatar-edit-btn" title="Cambiar foto">📷</button>
            </div>
            <div className="profile-header-text">
              <h2>{profileData.nombre_completo || 'Usuario'}</h2>
              <p>{profileData.email}</p>
              <span className={`role-badge ${role.class}`}>{role.label}</span>
            </div>
          </div>
          <button className="profile-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="profile-modal-content">
          {/* Tab: Perfil */}
          {activeTab === 'profile' && (
            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={profileData.nombre_completo}
                  onChange={(e) => setProfileData({ ...profileData, nombre_completo: e.target.value })}
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="tu@email.com"
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={profileData.telefono}
                  onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </form>
          )}

          {/* Tab: Seguridad */}
          {activeTab === 'security' && (
            <form className="password-form" onSubmit={handlePasswordSubmit}>
              <h3>Cambiar Contraseña</h3>
              
              <div className="form-group">
                <label>Contraseña Actual</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Cambiando...' : '🔐 Cambiar Contraseña'}
              </button>

              <div className="security-options">
                <h4>Opciones de Seguridad</h4>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-icon">🔐</span>
                    <div>
                      <strong>Autenticación 2FA</strong>
                      <p>Añade una capa extra de seguridad</p>
                    </div>
                  </div>
                  <button className="btn-secondary btn-sm">Configurar</button>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-icon">📱</span>
                    <div>
                      <strong>Sesiones Activas</strong>
                      <p>Ver dispositivos conectados</p>
                    </div>
                  </div>
                  <button className="btn-secondary btn-sm">Ver</button>
                </div>
              </div>
            </form>
          )}

          {/* Tab: Estadísticas */}
          {activeTab === 'stats' && (
            <div className="user-stats">
              <h3>Tu Rendimiento</h3>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <span className="stat-value">€{stats.ingresosMes.toLocaleString()}</span>
                    <span className="stat-label">Ingresos este mes</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🛒</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.ventasHoy}</span>
                    <span className="stat-label">Ventas hoy</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.citasHoy}</span>
                    <span className="stat-label">Citas hoy</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.clientesAtendidos}</span>
                    <span className="stat-label">Clientes atendidos</span>
                  </div>
                </div>
              </div>

              <div className="activity-log">
                <h4>Actividad Reciente</h4>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">🕐</span>
                    <div className="activity-info">
                      <p>Último acceso: <strong>Ahora</strong></p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">📅</span>
                    <div className="activity-info">
                      <p>Cuenta creada: <strong>{usuario?.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleDateString() : 'N/A'}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Preferencias */}
          {activeTab === 'preferences' && (
            <div className="user-preferences">
              <h3>Preferencias</h3>
              
              <div className="preference-group">
                <h4>Notificaciones</h4>
                <label className="preference-toggle">
                  <span>Notificaciones por email</span>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
                <label className="preference-toggle">
                  <span>Recordatorios de citas</span>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
                <label className="preference-toggle">
                  <span>Alertas de stock bajo</span>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-group">
                <h4>Interfaz</h4>
                <label className="preference-toggle">
                  <span>Modo compacto</span>
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
                <label className="preference-toggle">
                  <span>Animaciones</span>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-group">
                <h4>Idioma y Región</h4>
                <div className="form-group">
                  <label>Idioma</label>
                  <select defaultValue="es">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="ca">Català</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Zona Horaria</label>
                  <select defaultValue="Europe/Madrid">
                    <option value="Europe/Madrid">Europe/Madrid (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
              </div>

              <button className="btn-primary">💾 Guardar Preferencias</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
