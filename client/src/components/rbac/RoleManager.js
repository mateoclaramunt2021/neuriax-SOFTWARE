/**
 * PASO 10 - RoleManager Component
 * CRUD de roles con asignación de permisos
 */

import React, { useState } from 'react';
import { roleService, permissionService } from '../../services/rbacService';

function RoleManager({ roles, permissions, onRoleCreated, onRoleDeleted, onPermissionToggled }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', description: '', level: 5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Crear nuevo rol
  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const created = await roleService.createRole(newRole);
      onRoleCreated(created.data || created);
      setNewRole({ name: '', description: '', level: 5 });
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar rol
  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`¿Eliminar el rol "${roleName}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await roleService.deleteRole(roleId);
      onRoleDeleted(roleId);
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle permiso en rol
  const handleTogglePermission = async (roleId, permissionId, hasPermission) => {
    try {
      if (hasPermission) {
        await permissionService.removePermissionFromRole(roleId, permissionId);
      } else {
        await permissionService.assignPermissionToRole(roleId, permissionId);
      }
      onPermissionToggled();
    } catch (err) {
      setError(err.message);
    }
  };

  // Agrupar permisos por módulo
  const permissionsByModule = permissions.reduce((acc, perm) => {
    const module = perm.resource || perm.name?.split(':')[0] || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <div className="role-manager">
      {/* Error */}
      {error && (
        <div className="rm-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="rm-layout">
        {/* Lista de Roles */}
        <div className="rm-roles-list">
          <div className="rm-list-header">
            <h3>👥 Roles del Sistema</h3>
            <button 
              className="btn-create-role"
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Nuevo Rol
            </button>
          </div>

          <div className="rm-roles">
            {roles.map(role => (
              <div 
                key={role.id}
                className={`rm-role-item ${selectedRole?.id === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="rm-role-badge" style={{ 
                  background: getLevelColor(role.level || 0)
                }}>
                  {role.level || 0}
                </div>
                <div className="rm-role-info">
                  <span className="rm-role-name">{role.name}</span>
                  <span className="rm-role-desc">{role.description}</span>
                </div>
                <div className="rm-role-actions">
                  {role.isSystem ? (
                    <span className="rm-system-badge">🔒 Sistema</span>
                  ) : (
                    <button 
                      className="btn-delete-role"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id, role.name);
                      }}
                      title="Eliminar rol"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle del Rol */}
        <div className="rm-role-detail">
          {selectedRole ? (
            <>
              <div className="rm-detail-header">
                <div className="rm-detail-title">
                  <span className="rm-detail-badge" style={{ 
                    background: getLevelColor(selectedRole.level || 0)
                  }}>
                    Nivel {selectedRole.level || 0}
                  </span>
                  <h3>{selectedRole.name}</h3>
                  <p>{selectedRole.description}</p>
                </div>
                {selectedRole.isSystem && (
                  <div className="rm-system-warning">
                    <span>🔒</span>
                    <span>Los roles del sistema no se pueden modificar</span>
                  </div>
                )}
              </div>

              <div className="rm-permissions">
                <h4>🔑 Permisos Asignados</h4>
                
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="rm-permission-group">
                    <div className="rm-group-header">
                      <span className="rm-group-icon">{getModuleIcon(module)}</span>
                      <span className="rm-group-name">{formatModuleName(module)}</span>
                    </div>
                    <div className="rm-group-permissions">
                      {perms.map(perm => {
                        const hasPermission = selectedRole.permissions?.some(
                          p => p.id === perm.id || p === perm.id
                        );
                        return (
                          <label 
                            key={perm.id} 
                            className={`rm-permission-toggle ${hasPermission ? 'active' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={() => !selectedRole.isSystem && 
                                handleTogglePermission(selectedRole.id, perm.id, hasPermission)
                              }
                              disabled={selectedRole.isSystem}
                            />
                            <span className="toggle-action">
                              {perm.action || perm.name?.split(':')[1] || perm.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rm-no-selection">
              <span>👈</span>
              <p>Selecciona un rol para ver y editar sus permisos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Rol */}
      {showCreateModal && (
        <div className="rm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-header">
              <h3>➕ Crear Nuevo Rol</h3>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRole}>
              <div className="rm-form-group">
                <label>Nombre del Rol</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Ej: Supervisor"
                  required
                />
              </div>
              <div className="rm-form-group">
                <label>Descripción</label>
                <textarea
                  value={newRole.description}
                  onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe las responsabilidades de este rol"
                  rows={3}
                />
              </div>
              <div className="rm-form-group">
                <label>Nivel de Acceso (0 = más alto)</label>
                <select
                  value={newRole.level}
                  onChange={e => setNewRole({ ...newRole, level: parseInt(e.target.value) })}
                >
                  <option value={1}>1 - Alta dirección</option>
                  <option value={2}>2 - Gerencia</option>
                  <option value={3}>3 - Supervisión</option>
                  <option value={4}>4 - Operativo</option>
                  <option value={5}>5 - Básico</option>
                </select>
              </div>
              <div className="rm-modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  return module.charAt(0).toUpperCase() + module.slice(1);
}

export default RoleManager;
