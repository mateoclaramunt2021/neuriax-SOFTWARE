/**
 * PASO 10 - PermissionMatrix Component
 * Matriz visual de permisos por rol
 */

import React, { useState, useMemo } from 'react';
import { permissionService } from '../../services/rbacService';

function PermissionMatrix({ roles, permissions, onPermissionToggled }) {
  const [filter, setFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);

  // Agrupar permisos por módulo
  const permissionsByModule = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      const module = perm.resource || perm.name?.split(':')[0] || 'other';
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  // Módulos disponibles
  const modules = Object.keys(permissionsByModule);

  // Filtrar permisos
  const filteredPermissions = useMemo(() => {
    let perms = permissions;
    
    if (moduleFilter !== 'all') {
      perms = perms.filter(p => {
        const module = p.resource || p.name?.split(':')[0] || 'other';
        return module === moduleFilter;
      });
    }
    
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      perms = perms.filter(p => 
        p.name?.toLowerCase().includes(lowerFilter) ||
        p.description?.toLowerCase().includes(lowerFilter)
      );
    }
    
    return perms;
  }, [permissions, filter, moduleFilter]);

  // Toggle permiso
  const handleToggle = async (roleId, permissionId, hasPermission) => {
    const key = `${roleId}-${permissionId}`;
    try {
      setSaving(prev => ({ ...prev, [key]: true }));
      setError(null);
      
      if (hasPermission) {
        await permissionService.removePermissionFromRole(roleId, permissionId);
      } else {
        await permissionService.assignPermissionToRole(roleId, permissionId);
      }
      
      onPermissionToggled();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Verificar si rol tiene permiso
  const roleHasPermission = (role, permissionId) => {
    return role.permissions?.some(p => p.id === permissionId || p === permissionId);
  };

  return (
    <div className="permission-matrix">
      {/* Header con filtros */}
      <div className="pm-header">
        <div className="pm-filters">
          <div className="pm-search">
            <span>🔍</span>
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Buscar permisos..."
            />
          </div>
          <select 
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="pm-module-filter"
          >
            <option value="all">Todos los módulos</option>
            {modules.map(m => (
              <option key={m} value={m}>{formatModuleName(m)}</option>
            ))}
          </select>
        </div>
        <div className="pm-legend">
          <span className="legend-item active">✓ Permitido</span>
          <span className="legend-item denied">✕ Denegado</span>
          <span className="legend-item system">🔒 Sistema</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="pm-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Matriz */}
      <div className="pm-table-wrapper">
        <table className="pm-table">
          <thead>
            <tr>
              <th className="pm-permission-header">Permiso</th>
              {roles.map(role => (
                <th key={role.id} className="pm-role-header">
                  <div className="pm-role-cell">
                    <span 
                      className="pm-role-badge"
                      style={{ background: getLevelColor(role.level || 0) }}
                    >
                      {role.level || 0}
                    </span>
                    <span className="pm-role-name">{role.name}</span>
                    {role.isSystem && <span className="pm-system">🔒</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPermissions.map(perm => {
              const module = perm.resource || perm.name?.split(':')[0] || 'other';
              const action = perm.action || perm.name?.split(':')[1] || perm.name;
              
              return (
                <tr key={perm.id}>
                  <td className="pm-permission-cell">
                    <div className="pm-permission-info">
                      <span className="pm-module-badge">{getModuleIcon(module)}</span>
                      <div className="pm-permission-text">
                        <span className="pm-permission-name">{perm.name}</span>
                        <span className="pm-permission-desc">
                          {perm.description || `${action} en ${module}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  {roles.map(role => {
                    const hasPermission = roleHasPermission(role, perm.id);
                    const key = `${role.id}-${perm.id}`;
                    const isSaving = saving[key];
                    
                    return (
                      <td key={role.id} className="pm-toggle-cell">
                        <button
                          className={`pm-toggle ${hasPermission ? 'active' : ''} ${role.isSystem ? 'disabled' : ''}`}
                          onClick={() => !role.isSystem && handleToggle(role.id, perm.id, hasPermission)}
                          disabled={role.isSystem || isSaving}
                          title={role.isSystem ? 'Rol del sistema - no modificable' : 
                                 hasPermission ? 'Clic para revocar' : 'Clic para permitir'}
                        >
                          {isSaving ? (
                            <span className="pm-saving">⏳</span>
                          ) : hasPermission ? (
                            <span className="pm-check">✓</span>
                          ) : (
                            <span className="pm-cross">✕</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="pm-info">
        <p>
          <span>💡</span>
          Mostrando {filteredPermissions.length} de {permissions.length} permisos 
          en {roles.length} roles
        </p>
      </div>
    </div>
  );
}

// Helpers
function getLevelColor(level) {
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
    dashboard: '📊', clientes: '👥', servicios: '💇', citas: '📅',
    ventas: '💰', caja: '💵', inventario: '📦', empleados: '👨‍💼',
    reportes: '📈', configuracion: '⚙️', facturacion: '🧾',
    usuarios: '👤', tenant: '🏢'
  };
  return icons[module.toLowerCase()] || '📁';
}

function formatModuleName(module) {
  const names = {
    dashboard: 'Dashboard', clientes: 'Clientes', servicios: 'Servicios',
    citas: 'Citas', ventas: 'Ventas', caja: 'Caja', inventario: 'Inventario',
    empleados: 'Empleados', reportes: 'Reportes', configuracion: 'Configuración',
    facturacion: 'Facturación', usuarios: 'Usuarios', tenant: 'Negocio'
  };
  return names[module.toLowerCase()] || module.charAt(0).toUpperCase() + module.slice(1);
}

export default PermissionMatrix;
