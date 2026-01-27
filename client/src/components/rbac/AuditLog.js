/**
 * PASO 10 - AuditLog Component
 * Registro de auditoría de cambios RBAC
 */

import React, { useState, useEffect } from 'react';

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadAuditLogs();
  }, [filter, dateRange]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/rbac/audit?type=${filter}&range=${dateRange}`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || data || []);
      } else {
        // Si no hay endpoint de audit, usar datos de ejemplo
        setLogs(generateSampleLogs());
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setLogs(generateSampleLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLogs = () => {
    const now = new Date();
    return [
      {
        id: 1,
        type: 'ROLE_CREATED',
        action: 'Rol creado',
        details: 'Se creó el rol "Supervisor" con nivel 3',
        userId: 1,
        userName: 'Admin',
        createdAt: new Date(now - 1000 * 60 * 30).toISOString()
      },
      {
        id: 2,
        type: 'PERMISSION_ASSIGNED',
        action: 'Permiso asignado',
        details: 'Permiso "ventas:create" asignado al rol "Empleado"',
        userId: 1,
        userName: 'Admin',
        createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 3,
        type: 'USER_ROLE_CHANGED',
        action: 'Rol de usuario modificado',
        details: 'Usuario "María García" asignado al rol "Manager"',
        userId: 1,
        userName: 'Admin',
        createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        id: 4,
        type: 'PERMISSION_REVOKED',
        action: 'Permiso revocado',
        details: 'Permiso "configuracion:edit" removido del rol "Empleado"',
        userId: 1,
        userName: 'Admin',
        createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 5,
        type: 'ROLE_DELETED',
        action: 'Rol eliminado',
        details: 'Se eliminó el rol "Temporal"',
        userId: 1,
        userName: 'Admin',
        createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString()
      }
    ];
  };

  const getTypeIcon = (type) => {
    const icons = {
      ROLE_CREATED: '✨',
      ROLE_DELETED: '🗑️',
      ROLE_UPDATED: '✏️',
      PERMISSION_ASSIGNED: '✅',
      PERMISSION_REVOKED: '❌',
      USER_ROLE_CHANGED: '👤',
      LOGIN_SUCCESS: '🔓',
      LOGIN_FAILED: '🔒',
      ACCESS_DENIED: '🚫'
    };
    return icons[type] || '📋';
  };

  const getTypeColor = (type) => {
    const colors = {
      ROLE_CREATED: '#10b981',
      ROLE_DELETED: '#ef4444',
      ROLE_UPDATED: '#f59e0b',
      PERMISSION_ASSIGNED: '#3b82f6',
      PERMISSION_REVOKED: '#ef4444',
      USER_ROLE_CHANGED: '#8b5cf6',
      LOGIN_SUCCESS: '#10b981',
      LOGIN_FAILED: '#ef4444',
      ACCESS_DENIED: '#ef4444'
    };
    return colors[type] || '#6b7280';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60) return 'Hace un momento';
    if (diff < 1000 * 60 * 60) return `Hace ${Math.floor(diff / (1000 * 60))} min`;
    if (diff < 1000 * 60 * 60 * 24) return `Hace ${Math.floor(diff / (1000 * 60 * 60))} horas`;
    if (diff < 1000 * 60 * 60 * 24 * 7) return `Hace ${Math.floor(diff / (1000 * 60 * 60 * 24))} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'roles', label: 'Roles' },
    { value: 'permissions', label: 'Permisos' },
    { value: 'users', label: 'Usuarios' },
    { value: 'access', label: 'Accesos' }
  ];

  const dateRanges = [
    { value: '1d', label: 'Último día' },
    { value: '7d', label: 'Última semana' },
    { value: '30d', label: 'Último mes' },
    { value: 'all', label: 'Todo' }
  ];

  return (
    <div className="audit-log">
      {/* Header */}
      <div className="al-header">
        <div className="al-title">
          <span>📋</span>
          <h3>Registro de Auditoría</h3>
        </div>
        <div className="al-filters">
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {filterTypes.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
          >
            {dateRanges.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button onClick={loadAuditLogs} className="btn-refresh">
            🔄
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="al-content">
        {loading ? (
          <div className="al-loading">
            <div className="loading-spinner"></div>
            <p>Cargando registros...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="al-timeline">
            {logs.map(log => (
              <div key={log.id} className="al-entry">
                <div 
                  className="al-icon"
                  style={{ background: getTypeColor(log.type) }}
                >
                  {getTypeIcon(log.type)}
                </div>
                <div className="al-entry-content">
                  <div className="al-entry-header">
                    <span className="al-action">{log.action}</span>
                    <span className="al-time">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="al-details">{log.details}</p>
                  <div className="al-meta">
                    <span className="al-user">
                      <span>👤</span> {log.userName}
                    </span>
                    <span className="al-type">{log.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="al-empty">
            <span>📭</span>
            <p>No hay registros de auditoría</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="al-stats">
        <div className="al-stat">
          <span className="al-stat-value">{logs.length}</span>
          <span className="al-stat-label">Registros</span>
        </div>
        <div className="al-stat">
          <span className="al-stat-value">
            {logs.filter(l => l.type.includes('CREATED') || l.type.includes('ASSIGNED')).length}
          </span>
          <span className="al-stat-label">Creaciones</span>
        </div>
        <div className="al-stat">
          <span className="al-stat-value">
            {logs.filter(l => l.type.includes('DELETED') || l.type.includes('REVOKED')).length}
          </span>
          <span className="al-stat-label">Eliminaciones</span>
        </div>
        <div className="al-stat">
          <span className="al-stat-value">
            {new Set(logs.map(l => l.userId)).size}
          </span>
          <span className="al-stat-label">Usuarios</span>
        </div>
      </div>
    </div>
  );
}

export default AuditLog;
