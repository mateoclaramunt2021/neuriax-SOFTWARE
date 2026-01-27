/**
 * Dashboard Cliente - Interfaz específica para clientes
 * Buscar salones, ver reservas, gestionar perfil
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TrialBanner from './TrialBanner';
import '../styles/dashboard-cliente.css';

export default function DashboardCliente() {
  const navigate = useNavigate();
  const { usuario, logout, isAuthenticated } = useAuth();
  const [activeModule, setActiveModule] = useState('home');
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // Validar que es cliente
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    if (tipoUsuario !== 'cliente') {
      navigate('/dashboard/profesional', { replace: true });
      return;
    }

    // Cargar datos del usuario
    const userStored = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(userStored || usuario);
    setLoading(false);
  }, [isAuthenticated, navigate, usuario]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-cliente-container">
      {/* Sidebar */}
      <aside className={`sidebar-cliente ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">💈 NEURIAX</h1>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀️' : '▶️'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeModule === 'home' ? 'active' : ''}`}
            onClick={() => setActiveModule('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Inicio</span>
          </button>

          <button 
            className={`nav-item ${activeModule === 'buscar' ? 'active' : ''}`}
            onClick={() => setActiveModule('buscar')}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-label">Buscar Salones</span>
          </button>

          <button 
            className={`nav-item ${activeModule === 'reservas' ? 'active' : ''}`}
            onClick={() => setActiveModule('reservas')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Mis Reservas</span>
          </button>

          <button 
            className={`nav-item ${activeModule === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveModule('perfil')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Mi Perfil</span>
          </button>

          <button 
            className={`nav-item ${activeModule === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveModule('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Configuración</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <h2 className="module-title">
              {activeModule === 'home' && 'Bienvenido'}
              {activeModule === 'buscar' && 'Buscar Salones'}
              {activeModule === 'reservas' && 'Mis Reservas'}
              {activeModule === 'perfil' && 'Mi Perfil'}
              {activeModule === 'settings' && 'Configuración'}
            </h2>
          </div>
          <div className="topbar-right">
            <span className="user-badge">👤 {userData?.nombre || usuario?.nombre || 'Cliente'}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Banner de Período de Prueba */}
          {userData?.diasPruebaRestantes !== undefined && userData?.diasPruebaRestantes !== null && (
            <TrialBanner 
              diasRestantes={userData.diasPruebaRestantes}
              tenantName={userData?.nombre}
            />
          )}
          
          {/* Módulo: Home */}
          {activeModule === 'home' && (
            <section className="content-section">
              <div className="welcome-card">
                <h2>Hola, {userData?.nombre || 'Cliente'}! 👋</h2>
                <p>Bienvenido a NEURIAX, tu plataforma de reservas de salones</p>
              </div>

              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h3>Próximas Citas</h3>
                    <p className="stat-value">0</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3>Salones Favoritos</h3>
                    <p className="stat-value">0</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🎟️</div>
                  <div className="stat-content">
                    <h3>Promociones</h3>
                    <p className="stat-value">0</p>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="action-btn action-btn-primary"
                  onClick={() => setActiveModule('buscar')}
                >
                  🔍 Buscar Salones
                </button>
                <button 
                  className="action-btn action-btn-secondary"
                  onClick={() => setActiveModule('reservas')}
                >
                  📅 Ver Mis Reservas
                </button>
              </div>
            </section>
          )}

          {/* Módulo: Buscar */}
          {activeModule === 'buscar' && (
            <section className="content-section">
              <div className="search-section">
                <h3>Buscar Salones</h3>
                <p className="section-description">Encuentra los mejores salones y peluquerías cerca de ti</p>
                <div className="search-placeholder">
                  <p>🔍 Sistema de búsqueda en desarrollo</p>
                </div>
              </div>
            </section>
          )}

          {/* Módulo: Reservas */}
          {activeModule === 'reservas' && (
            <section className="content-section">
              <div className="reservas-section">
                <h3>Mis Reservas</h3>
                <p className="section-description">Gestiona tus citas y reservas</p>
                <div className="reservas-placeholder">
                  <p>📅 No tienes reservas programadas</p>
                  <button 
                    className="action-btn action-btn-primary"
                    onClick={() => setActiveModule('buscar')}
                  >
                    Hacer una reserva
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Módulo: Perfil */}
          {activeModule === 'perfil' && (
            <section className="content-section">
              <div className="perfil-section">
                <h3>Mi Perfil</h3>
                <div className="perfil-card">
                  <div className="perfil-header">
                    <div className="perfil-avatar">👤</div>
                    <div className="perfil-info">
                      <h4>{userData?.nombre || usuario?.nombre || 'Cliente'}</h4>
                      <p>{userData?.email || usuario?.email || 'email@ejemplo.com'}</p>
                    </div>
                  </div>
                  <div className="perfil-details">
                    <div className="detail-row">
                      <span className="detail-label">Teléfono:</span>
                      <span className="detail-value">{userData?.telefono || 'No proporcionado'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Miembro desde:</span>
                      <span className="detail-value">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Módulo: Configuración */}
          {activeModule === 'settings' && (
            <section className="content-section">
              <div className="settings-section">
                <h3>Configuración</h3>
                <p className="section-description">Gestiona tus preferencias y seguridad</p>
                <div className="settings-placeholder">
                  <p>⚙️ Configuración en desarrollo</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
