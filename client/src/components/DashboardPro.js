/**
 * Dashboard Pro - VERSIÓN SIMPLE Y FUNCIONAL
 * POS PRIMERO para cobrar fácil
 * Citas SEGUNDO para reservas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import POSModule from './modules/POSModule';
import CajaModule from './modules/CajaModule';
import AppointmentsModule from './modules/AppointmentsModule';
import ClientsModule from './modules/ClientsModule';
import ServicesModule from './modules/ServicesModule';
import InventoryModule from './modules/InventoryModule';
import EmployeesModule from './modules/EmployeesModule';
import FacturacionModule from './modules/FacturacionModule';
import NotificacionesModule from './modules/NotificacionesModule';
import SettingsModule from './modules/SettingsModule';
import MarketplaceProfileModule from './modules/MarketplaceProfileModule';
import PlanLimitsDisplay from './PlanLimitsDisplay';
import UpgradePrompt from './UpgradePrompt';
import TrialWarning from './TrialWarning';
import TrialBanner from './TrialBanner';
import { useDashboardTour } from './DashboardTour';
import api from '../services/api';
import '../styles/dashboardpro-final.css';

export default function DashboardPro({ usuario, onLogout }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [activeModule, setActiveModule] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    ventasHoy: 0,
    citasHoy: 0
  });
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState(null);
  const [trialStatus, setTrialStatus] = useState(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Usar el hook del tour
  useDashboardTour(isFirstVisit);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userStored = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData(userStored);

      // Cargar información de límites del plan
      try {
        const limitsRes = await api.get('/api/plans/limits');
        if (limitsRes.data?.success && limitsRes.data?.data) {
          setPlanLimits(limitsRes.data.data);
        }
      } catch (err) {
        console.warn('No se pudieron cargar los límites del plan:', err);
      }

      // Cargar estado del trial
      try {
        const trialRes = await api.get('/api/trial/status');
        if (trialRes.data?.success && trialRes.data?.data) {
          setTrialStatus(trialRes.data.data);
          
          // Verificar si es la primera visita
          const hasVisited = localStorage.getItem('hasVisitedDashboard');
          if (!hasVisited && trialRes.data.data.isTrial) {
            setIsFirstVisit(true);
            localStorage.setItem('hasVisitedDashboard', 'true');
          }
        }
      } catch (err) {
        console.warn('No se pudo cargar el estado del trial:', err);
      }

      const [clientesRes, ventasRes, citasRes] = await Promise.allSettled([
        api.get('/clientes').catch(() => ({ data: { data: [], clientes: [] } })),
        api.get('/ventas').catch(() => ({ data: { data: [], ventas: [] } })),
        api.get('/citas').catch(() => ({ data: { data: [], citas: [] } }))
      ]);

      const clientes = clientesRes.status === 'fulfilled' 
        ? (clientesRes.value?.data?.data || clientesRes.value?.data?.clientes || [])
        : [];
      
      const ventas = ventasRes.status === 'fulfilled'
        ? (ventasRes.value?.data?.data || ventasRes.value?.data?.ventas || [])
        : [];

      const citas = citasRes.status === 'fulfilled'
        ? (citasRes.value?.data?.data || citasRes.value?.data?.citas || [])
        : [];

      const hoy = new Date().toLocaleDateString('es-ES');
      const ventasHoy = ventas.filter(v => {
        try {
          return new Date(v.fecha).toLocaleDateString('es-ES') === hoy;
        } catch {
          return false;
        }
      }).length;

      const citasHoy = citas.filter(c => {
        try {
          return new Date(c.fecha).toLocaleDateString('es-ES') === hoy;
        } catch {
          return false;
        }
      }).length;

      setStats({
        totalClientes: clientes.length || 0,
        ventasHoy: ventasHoy || 0,
        citasHoy: citasHoy || 0
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderModule = () => {
    try {
      switch (activeModule) {
        case 'pos':
          return <POSModule stats={stats} />;
        case 'caja':
          return <CajaModule />;
        case 'citas':
          return <AppointmentsModule />;
        case 'clientes':
          return <ClientsModule />;
        case 'servicios':
          return <ServicesModule />;
        case 'inventario':
          return <InventoryModule />;
        case 'empleados':
          return <EmployeesModule />;
        case 'facturacion':
          return <FacturacionModule />;
        case 'notificaciones':
          return <NotificacionesModule />;
        case 'marketplace':
          return <MarketplaceProfileModule />;
        case 'configuracion':
          return <SettingsModule userData={userData} onLogout={onLogout} />;
        default:
          return <POSModule stats={stats} />;
      }
    } catch (error) {
      return <div style={{ padding: '40px', color: '#ef4444' }}>Error: {error.message}</div>;
    }
  };

  const menuItems = [
    { id: 'pos', label: 'Punto de Venta', icon: '💳', main: true },
    { id: 'citas', label: 'Reservas', icon: '📅', main: true },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'servicios', label: 'Servicios', icon: '✂️' },
    { id: 'inventario', label: 'Inventario', icon: '📦' },
    { id: 'empleados', label: 'Empleados', icon: '👔' },
    { id: 'caja', label: 'Caja', icon: '💰' },
    { id: 'facturacion', label: 'Facturas', icon: '🧾' },
    { id: 'marketplace', label: 'Marketplace', icon: '🏪' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
    { id: 'configuracion', label: 'Ajustes', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">💇 SalonHub</div>
          <button 
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeModule === item.id ? 'active' : ''} ${item.main ? 'main' : ''}`}
              onClick={() => setActiveModule(item.id)}
              title={item.label}
            >
              <span className="icon">{item.icon}</span>
              {sidebarOpen && <span className="label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            🚪 {sidebarOpen ? 'Salir' : ''}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle menu"
            >
              ☰
            </button>
            <div className="stats-mini">
              <div className="stat-mini">
                <span className="icon">👥</span>
                <span className="value">{stats.totalClientes}</span>
                <span className="label">Clientes</span>
              </div>
              <div className="stat-mini">
                <span className="icon">📅</span>
                <span className="value">{stats.citasHoy}</span>
                <span className="label">Hoy</span>
              </div>
              <div className="stat-mini">
                <span className="icon">💰</span>
                <span className="value">{stats.ventasHoy}</span>
                <span className="label">Ventas</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <button className="header-btn" title="Notificaciones">🔔</button>
            <div className="user-card">
              <div className="avatar">
                {userData?.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <div className="name">{userData?.nombre || 'Usuario'}</div>
                <div className="role">{userData?.rol || 'Admin'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <div className="dashboard-content">
          {/* Banner de Período de Prueba */}
          {userData?.diasPruebaRestantes !== undefined && userData?.diasPruebaRestantes !== null && (
            <TrialBanner 
              diasRestantes={userData.diasPruebaRestantes}
              tenantName={userData?.nombre_negocio || userData?.nombre}
            />
          )}
          
          {/* Mostrar límites del plan si está disponible */}
          {planLimits && (
            <PlanLimitsDisplay
              planName={planLimits.planNombre}
              planId={planLimits.planId}
              usage={planLimits.usage}
              limits={planLimits.limits}
              diasRestantes={planLimits.tenant?.diasRestantes}
              onUpgradeClick={() => navigate('/checkout')}
            />
          )}

          {/* Módulo activo */}
          {renderModule()}
        </div>
      </main>

      {/* Modal Upgrade */}
      {showUpgradePrompt && upgradePromptData && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          resourceType={upgradePromptData.resourceType}
          current={upgradePromptData.current}
          limit={upgradePromptData.limit}
          planName={upgradePromptData.planName}
          planId={upgradePromptData.planId}
        />
      )}

      {/* Trial Warning */}
      {trialStatus && (
        <TrialWarning
          diasRestantes={trialStatus.diasRestantes}
          onUpgradeClick={() => navigate('/checkout')}
        />
      )}
    </div>
  );
}
