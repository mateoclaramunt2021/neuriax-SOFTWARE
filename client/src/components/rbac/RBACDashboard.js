/**
 * PASO 10 - RBAC Dashboard
 * Panel de administración de roles y permisos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { roleService, permissionService, userRoleService, rbacBatchService } from '../../services/rbacService';
import RoleManager from './RoleManager';
import PermissionMatrix from './PermissionMatrix';
import UserRoleAssignment from './UserRoleAssignment';
import AuditLog from './AuditLog';
import './RBACDashboard.css';

function RBACDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Cargar datos RBAC
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await rbacBatchService.fetchAllRBACData();
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);

      // Cargar usuarios
      const token = localStorage.getItem('authToken');
      const usersResponse = await fetch(`${API_URL}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      setUsers(usersData.data || []);

      // Calcular estadísticas
      setStats({
        totalRoles: data.roles?.length || 0,
        totalPermissions: data.permissions?.length || 0,
        totalUsers: usersData.data?.length || 0,
        customRoles: data.roles?.filter(r => !r.isSystem).length || 0
      });

    } catch (err) {
      console.error('Error loading RBAC data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleRoleCreated = (newRole) => {
    setRoles([...roles, newRole]);
    setStats(prev => ({ ...prev, totalRoles: prev.totalRoles + 1, customRoles: prev.customRoles + 1 }));
  };

  const handleRoleDeleted = (roleId) => {
    setRoles(roles.filter(r => r.id !== roleId));
    setStats(prev => ({ ...prev, totalRoles: prev.totalRoles - 1, customRoles: prev.customRoles - 1 }));
  };

  const handlePermissionToggled = () => {
    loadData(); // Recargar para actualizar matriz
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'roles', label: 'Roles', icon: '👥' },
    { id: 'permissions', label: 'Permisos', icon: '🔐' },
    { id: 'users', label: 'Usuarios', icon: '👤' },
    { id: 'audit', label: 'Auditoría', icon: '📋' }
  ];

  return (
    <div className="rbac-dashboard">
      {/* Header */}
      <div className="rbac-header">
        <div className="rbac-header-content">
          <div className="rbac-title">
            <span className="rbac-icon">🔐</span>
            <div>
              <h1>Control de Acceso (RBAC)</h1>
              <p>Gestión de Roles y Permisos del Sistema</p>
            </div>
          </div>
          <button onClick={loadData} className="btn-refresh" disabled={loading}>
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rbac-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="rbac-stats">
        <div className="stat-card">
          <div className="stat-icon roles">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalRoles}</span>
            <span className="stat-label">Roles Totales</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon permissions">🔑</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalPermissions}</span>
            <span className="stat-label">Permisos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon users">👤</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Usuarios</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon custom">⚙️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.customRoles}</span>
            <span className="stat-label">Roles Personalizados</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rbac-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`rbac-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rbac-content">
        {loading ? (
          <div className="rbac-loading">
            <div className="loading-spinner"></div>
            <p>Cargando datos RBAC...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewPanel 
                roles={roles} 
                permissions={permissions} 
                users={users}
              />
            )}
            {activeTab === 'roles' && (
              <RoleManager 
                roles={roles}
                permissions={permissions}
                onRoleCreated={handleRoleCreated}
                onRoleDeleted={handleRoleDeleted}
                onPermissionToggled={handlePermissionToggled}
              />
            )}
            {activeTab === 'permissions' && (
              <PermissionMatrix 
                roles={roles}
                permissions={permissions}
                onPermissionToggled={handlePermissionToggled}
              />
            )}
            {activeTab === 'users' && (
              <UserRoleAssignment 
                users={users}
                roles={roles}
                onRefresh={loadData}
              />
            )}
            {activeTab === 'audit' && (
              <AuditLog />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW PANEL
// ============================================================

function OverviewPanel({ roles, permissions, users }) {
  // Agrupar permisos por módulo
  const permissionsByModule = permissions.reduce((acc, perm) => {
    const module = perm.resource || perm.name?.split(':')[0] || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  // Roles del sistema vs personalizados
  const systemRoles = roles.filter(r => r.isSystem);
  const customRoles = roles.filter(r => !r.isSystem);

  return (
    <div className="overview-panel">
      {/* Sistema de Roles */}
      <div className="overview-section">
        <h3>🏛️ Jerarquía de Roles</h3>
        <div className="role-hierarchy">
          {roles.sort((a, b) => (a.level || 0) - (b.level || 0)).map(role => (
            <div key={role.id} className={`hierarchy-item level-${role.level || 0}`}>
              <div className="hierarchy-badge" style={{ 
                '--level': role.level || 0,
                background: getRoleColor(role.level || 0)
              }}>
                {role.level || 0}
              </div>
              <div className="hierarchy-info">
                <span className="hierarchy-name">{role.name}</span>
                <span className="hierarchy-desc">{role.description}</span>
              </div>
              <span className={`role-type ${role.isSystem ? 'system' : 'custom'}`}>
                {role.isSystem ? '🔒 Sistema' : '⚙️ Custom'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Módulos de Permisos */}
      <div className="overview-section">
        <h3>📦 Módulos del Sistema</h3>
        <div className="modules-grid">
          {Object.entries(permissionsByModule).map(([module, perms]) => (
            <div key={module} className="module-card">
              <div className="module-header">
                <span className="module-icon">{getModuleIcon(module)}</span>
                <span className="module-name">{formatModuleName(module)}</span>
              </div>
              <div className="module-permissions">
                {perms.slice(0, 4).map(p => (
                  <span key={p.id} className="permission-chip">
                    {p.action || p.name?.split(':')[1] || p.name}
                  </span>
                ))}
                {perms.length > 4 && (
                  <span className="permission-more">+{perms.length - 4} más</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="overview-section">
        <h3>📈 Estadísticas Rápidas</h3>
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="qs-label">Roles del Sistema</span>
            <span className="qs-value">{systemRoles.length}</span>
          </div>
          <div className="quick-stat">
            <span className="qs-label">Roles Personalizados</span>
            <span className="qs-value">{customRoles.length}</span>
          </div>
          <div className="quick-stat">
            <span className="qs-label">Módulos</span>
            <span className="qs-value">{Object.keys(permissionsByModule).length}</span>
          </div>
          <div className="quick-stat">
            <span className="qs-label">Usuarios Activos</span>
            <span className="qs-value">{users.filter(u => u.activo !== false).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getRoleColor(level) {
  const colors = {
    0: 'linear-gradient(135deg, #ef4444, #dc2626)',
    1: 'linear-gradient(135deg, #f59e0b, #d97706)',
    2: 'linear-gradient(135deg, #10b981, #059669)',
    3: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    4: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    5: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
  };
  return colors[level] || colors[5];
}

function getModuleIcon(module) {
  const icons = {
    dashboard: '📊',
    clientes: '👥',
    servicios: '💇',
    citas: '📅',
    ventas: '💰',
    caja: '💵',
    inventario: '📦',
    empleados: '👨‍💼',
    reportes: '📈',
    configuracion: '⚙️',
    facturacion: '🧾',
    usuarios: '👤',
    tenant: '🏢'
  };
  return icons[module.toLowerCase()] || '📁';
}

function formatModuleName(module) {
  const names = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    servicios: 'Servicios',
    citas: 'Citas',
    ventas: 'Ventas',
    caja: 'Caja',
    inventario: 'Inventario',
    empleados: 'Empleados',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    facturacion: 'Facturación',
    usuarios: 'Usuarios',
    tenant: 'Negocio'
  };
  return names[module.toLowerCase()] || module.charAt(0).toUpperCase() + module.slice(1);
}

export default RBACDashboard;
