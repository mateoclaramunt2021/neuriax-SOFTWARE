/**
 * PASO 10 - UserRoleAssignment Component
 * Asignación de roles a usuarios
 */

import React, { useState, useEffect } from 'react';
import { userRoleService } from '../../services/rbacService';

function UserRoleAssignment({ users, roles, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Cargar roles del usuario seleccionado
  useEffect(() => {
    if (selectedUser) {
      loadUserRoles(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUserRoles = async (userId) => {
    try {
      setLoading(true);
      const data = await userRoleService.getUserRoles(userId);
      setUserRoles(data || []);
    } catch (err) {
      console.error('Error loading user roles:', err);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Asignar rol
  const handleAssignRole = async (roleId) => {
    try {
      setSaving(true);
      setError(null);
      await userRoleService.assignRoleToUser(selectedUser.id, roleId);
      await loadUserRoles(selectedUser.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Remover rol
  const handleRemoveRole = async (roleId) => {
    try {
      setSaving(true);
      setError(null);
      await userRoleService.removeRoleFromUser(selectedUser.id, roleId);
      await loadUserRoles(selectedUser.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.nombre_completo?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  // Verificar si usuario tiene rol
  const userHasRole = (roleId) => {
    return userRoles.some(ur => ur.id === roleId || ur.roleId === roleId);
  };

  return (
    <div className="user-role-assignment">
      {/* Error */}
      {error && (
        <div className="ura-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="ura-layout">
        {/* Lista de Usuarios */}
        <div className="ura-users-panel">
          <div className="ura-panel-header">
            <h3>👤 Usuarios</h3>
            <div className="ura-search">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
              />
            </div>
          </div>

          <div className="ura-users-list">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className={`ura-user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="ura-user-avatar">
                  {user.nombre_completo?.charAt(0) || user.username?.charAt(0) || '?'}
                </div>
                <div className="ura-user-info">
                  <span className="ura-user-name">{user.nombre_completo || user.username}</span>
                  <span className="ura-user-email">{user.email}</span>
                </div>
                <div className="ura-user-role-badge">
                  {user.rol || 'Sin rol'}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="ura-no-results">
                <span>🔍</span>
                <p>No se encontraron usuarios</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Roles */}
        <div className="ura-roles-panel">
          {selectedUser ? (
            <>
              <div className="ura-panel-header">
                <div className="ura-selected-user">
                  <div className="ura-user-avatar large">
                    {selectedUser.nombre_completo?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3>{selectedUser.nombre_completo || selectedUser.username}</h3>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="ura-loading">
                  <div className="loading-spinner"></div>
                  <p>Cargando roles...</p>
                </div>
              ) : (
                <>
                  {/* Roles Asignados */}
                  <div className="ura-section">
                    <h4>✅ Roles Asignados</h4>
                    {userRoles.length > 0 ? (
                      <div className="ura-assigned-roles">
                        {userRoles.map(role => (
                          <div key={role.id} className="ura-assigned-role">
                            <div className="ura-role-info">
                              <span 
                                className="ura-role-badge"
                                style={{ background: getLevelColor(role.level || 0) }}
                              >
                                {role.level || 0}
                              </span>
                              <div>
                                <span className="ura-role-name">{role.name}</span>
                                <span className="ura-role-desc">{role.description}</span>
                              </div>
                            </div>
                            <button
                              className="btn-remove-role"
                              onClick={() => handleRemoveRole(role.id)}
                              disabled={saving}
                              title="Remover rol"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ura-no-roles">Este usuario no tiene roles asignados</p>
                    )}
                  </div>

                  {/* Roles Disponibles */}
                  <div className="ura-section">
                    <h4>📋 Roles Disponibles</h4>
                    <div className="ura-available-roles">
                      {roles.filter(r => !userHasRole(r.id)).map(role => (
                        <div key={role.id} className="ura-available-role">
                          <div className="ura-role-info">
                            <span 
                              className="ura-role-badge"
                              style={{ background: getLevelColor(role.level || 0) }}
                            >
                              {role.level || 0}
                            </span>
                            <div>
                              <span className="ura-role-name">{role.name}</span>
                              <span className="ura-role-desc">{role.description}</span>
                            </div>
                          </div>
                          <button
                            className="btn-assign-role"
                            onClick={() => handleAssignRole(role.id)}
                            disabled={saving}
                            title="Asignar rol"
                          >
                            ➕
                          </button>
                        </div>
                      ))}
                      {roles.filter(r => !userHasRole(r.id)).length === 0 && (
                        <p className="ura-all-assigned">
                          El usuario tiene todos los roles disponibles
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="ura-no-selection">
              <span>👈</span>
              <p>Selecciona un usuario para gestionar sus roles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper
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

export default UserRoleAssignment;
