/**
 * Admin Dashboard - Panel de Administración
 * Acceso exclusivo para administradores
 * SOLO PARA REVISAR Y GESTIONAR EL SISTEMA
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin-dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { usuario, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessionals: 0,
    totalClients: 0,
    totalReservations: 0,
    activeTrials: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Verificar que sea admin
  useEffect(() => {
    if (!isAuthenticated || usuario?.rol !== 'administrador') {
      navigate('/login', { replace: true });
      return;
    }
  }, [isAuthenticated, usuario, navigate]);

  // Cargar estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && usuario?.rol === 'administrador') {
      fetchStats();
    }
  }, [isAuthenticated, usuario]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return <div className="admin-loading">Cargando panel administrativo...</div>;
  }

  return (
    <div className="admin-dashboard">
      
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-icon">⚙️</div>
          <div className="admin-text">
            <h2>ADMIN</h2>
            <p>Control Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="icon">📊</span>
            <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="icon">👥</span>
            <span>Usuarios</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'professionals' ? 'active' : ''}`}
            onClick={() => setActiveTab('professionals')}
          >
            <span className="icon">💼</span>
            <span>Profesionales</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <span className="icon">🛍️</span>
            <span>Clientes</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <span className="icon">📅</span>
            <span>Reservas</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="icon">⚙️</span>
            <span>Configuración</span>
          </button>
        </nav>

        <div className="admin-footer">
          <div className="admin-user">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <p className="user-name">{usuario?.nombre_completo || 'Admin'}</p>
              <p className="user-role">Administrador</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        
        {/* Header */}
        <header className="admin-header">
          <h1>Panel de Administración NEURIAX</h1>
          <p>Sistema de revisión y control para administradores únicamente</p>
        </header>

        {/* Content Based on Active Tab */}
        <div className="admin-body">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <h2>Resumen General del Sistema</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">👥</span>
                    <span className="stat-title">Usuarios Totales</span>
                  </div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <p className="stat-change">+0% este mes</p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">💼</span>
                    <span className="stat-title">Profesionales</span>
                  </div>
                  <div className="stat-value">{stats.totalProfessionals}</div>
                  <p className="stat-change">+0% este mes</p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">🛍️</span>
                    <span className="stat-title">Clientes</span>
                  </div>
                  <div className="stat-value">{stats.totalClients}</div>
                  <p className="stat-change">+0% este mes</p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">📅</span>
                    <span className="stat-title">Reservas</span>
                  </div>
                  <div className="stat-value">{stats.totalReservations}</div>
                  <p className="stat-change">+0% este mes</p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">⏰</span>
                    <span className="stat-title">Trials Activos</span>
                  </div>
                  <div className="stat-value">{stats.activeTrials}</div>
                  <p className="stat-change">+0% este mes</p>
                </div>
              </div>

              <div className="alert-box">
                <span className="alert-icon">✅</span>
                <div className="alert-content">
                  <h3>Sistema Operativo</h3>
                  <p>Todos los servicios están funcionando correctamente</p>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="tab-content">
              <h2>Gestión de Usuarios</h2>
              <p className="tab-description">Aquí puedes ver y gestionar todos los usuarios del sistema</p>
              <div className="placeholder-content">
                <p>Funcionalidad en desarrollo...</p>
              </div>
            </div>
          )}

          {/* PROFESSIONALS TAB */}
          {activeTab === 'professionals' && (
            <div className="tab-content">
              <h2>Gestión de Profesionales</h2>
              <p className="tab-description">Revisa los profesionales y sus establecimientos</p>
              <div className="placeholder-content">
                <p>Funcionalidad en desarrollo...</p>
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <div className="tab-content">
              <h2>Gestión de Clientes</h2>
              <p className="tab-description">Revisa los clientes y sus actividades</p>
              <div className="placeholder-content">
                <p>Funcionalidad en desarrollo...</p>
              </div>
            </div>
          )}

          {/* RESERVATIONS TAB */}
          {activeTab === 'reservations' && (
            <div className="tab-content">
              <h2>Gestión de Reservas</h2>
              <p className="tab-description">Revisa todas las reservas del sistema</p>
              <div className="placeholder-content">
                <p>Funcionalidad en desarrollo...</p>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <h2>Configuración del Sistema</h2>
              <p className="tab-description">Ajustes generales y configuración</p>
              <div className="placeholder-content">
                <p>Funcionalidad en desarrollo...</p>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
