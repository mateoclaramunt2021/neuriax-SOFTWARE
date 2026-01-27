/**
 * PASO 10 - usePermissions Hook
 * Hook para gestión de permisos RBAC en React
 * Proporciona verificación de permisos, caching y UI adaptativa
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { userRoleService, rbacBatchService } from '../services/rbacService';

// Context para compartir permisos globalmente
const PermissionsContext = createContext(null);

// ============================================================
// PERMISSIONS PROVIDER
// ============================================================

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration (5 minutos)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Cargar permisos del usuario actual
  const loadPermissions = useCallback(async (forceRefresh = false) => {
    try {
      // Verificar cache
      const now = Date.now();
      if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
        return;
      }

      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        setPermissions([]);
        setRoles([]);
        setLoading(false);
        return;
      }

      // Si es administrador, tiene todos los permisos
      if (user.rol === 'administrador' || user.rol === 'admin') {
        setPermissions(['*']); // Wildcard para admin
        setRoles([{ id: 0, name: 'Administrador', level: 0 }]);
        setLastFetch(now);
        setLoading(false);
        return;
      }

      // Obtener perfil RBAC del usuario
      const profile = await rbacBatchService.fetchUserRBACProfile(user.id);
      
      setRoles(profile.roles || []);
      setPermissions(profile.permissions?.map(p => p.name) || []);
      setLastFetch(now);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err.message);
      // En caso de error, dar permisos básicos
      setPermissions(['dashboard:view']);
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  // Cargar al montar
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Verificar un permiso específico
  const hasPermission = useCallback((permission) => {
    // Admin tiene todos los permisos
    if (permissions.includes('*')) return true;
    
    // Verificar permiso exacto
    if (permissions.includes(permission)) return true;
    
    // Verificar wildcard de módulo (ej: 'clientes:*')
    const [module] = permission.split(':');
    if (permissions.includes(`${module}:*`)) return true;
    
    return false;
  }, [permissions]);

  // Verificar múltiples permisos (AND)
  const hasAllPermissions = useCallback((perms) => {
    return perms.every(p => hasPermission(p));
  }, [hasPermission]);

  // Verificar al menos un permiso (OR)
  const hasAnyPermission = useCallback((perms) => {
    return perms.some(p => hasPermission(p));
  }, [hasPermission]);

  // Verificar rol específico
  const hasRole = useCallback((roleName) => {
    return roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
  }, [roles]);

  // Verificar nivel de rol (0 = más alto)
  const hasRoleLevel = useCallback((maxLevel) => {
    return roles.some(r => r.level <= maxLevel);
  }, [roles]);

  // Obtener permisos por módulo
  const getModulePermissions = useCallback((module) => {
    return permissions.filter(p => p.startsWith(`${module}:`));
  }, [permissions]);

  // Valor del contexto
  const value = useMemo(() => ({
    permissions,
    roles,
    loading,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasRoleLevel,
    getModulePermissions,
    refreshPermissions: () => loadPermissions(true)
  }), [
    permissions,
    roles,
    loading,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasRoleLevel,
    getModulePermissions,
    loadPermissions
  ]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function usePermissions() {
  const context = useContext(PermissionsContext);
  
  if (!context) {
    // Si no hay provider, usar implementación standalone
    return useStandalonePermissions();
  }
  
  return context;
}

// ============================================================
// HOOK STANDALONE (sin provider)
// ============================================================

function useStandalonePermissions() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerms = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
          setLoading(false);
          return;
        }

        if (user.rol === 'administrador' || user.rol === 'admin') {
          setPermissions(['*']);
          setRoles([{ name: 'Administrador' }]);
        } else {
          const profile = await rbacBatchService.fetchUserRBACProfile(user.id);
          setRoles(profile.roles || []);
          setPermissions(profile.permissions?.map(p => p.name) || []);
        }
      } catch (err) {
        console.error('Error loading permissions:', err);
        setPermissions(['dashboard:view']);
      } finally {
        setLoading(false);
      }
    };

    loadPerms();
  }, []);

  const hasPermission = useCallback((permission) => {
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms) => {
    return perms.some(p => hasPermission(p));
  }, [hasPermission]);

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions: (perms) => perms.every(p => hasPermission(p)),
    hasRole: (name) => roles.some(r => r.name === name),
    hasRoleLevel: () => true,
    getModulePermissions: (m) => permissions.filter(p => p.startsWith(`${m}:`)),
    refreshPermissions: () => {}
  };
}

// ============================================================
// HOOK PARA VERIFICAR UN PERMISO ESPECÍFICO
// ============================================================

export function useCanAccess(permission) {
  const { hasPermission, loading } = usePermissions();
  
  return {
    canAccess: hasPermission(permission),
    loading
  };
}

// ============================================================
// HOOK PARA VERIFICAR ACCESO A MÓDULO
// ============================================================

export function useModuleAccess(module) {
  const { hasPermission, getModulePermissions, loading } = usePermissions();
  
  const modulePerms = getModulePermissions(module);
  
  return {
    canView: hasPermission(`${module}:view`),
    canCreate: hasPermission(`${module}:create`),
    canEdit: hasPermission(`${module}:edit`),
    canDelete: hasPermission(`${module}:delete`),
    permissions: modulePerms,
    loading
  };
}

// ============================================================
// COMPONENTE HOC PARA PROTEGER COMPONENTES
// ============================================================

export function withPermission(WrappedComponent, requiredPermission, FallbackComponent = null) {
  return function PermissionWrapper(props) {
    const { hasPermission, loading } = usePermissions();
    
    if (loading) {
      return <div className="permission-loading">Verificando permisos...</div>;
    }
    
    if (!hasPermission(requiredPermission)) {
      return FallbackComponent || (
        <div className="permission-denied">
          <span>🔒</span>
          <p>No tienes permiso para acceder a esta función</p>
          <small>Permiso requerido: {requiredPermission}</small>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}

// ============================================================
// COMPONENTE CONDICIONAL BASADO EN PERMISOS
// ============================================================

export function Can({ permission, permissions, any = false, children, fallback = null }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  
  if (loading) return null;
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = any ? hasAnyPermission(permissions) : hasAllPermissions(permissions);
  }
  
  return hasAccess ? children : fallback;
}

// ============================================================
// COMPONENTE PARA MOSTRAR SEGÚN ROL
// ============================================================

export function RoleGate({ roles: allowedRoles, children, fallback = null }) {
  const { hasRole, loading } = usePermissions();
  
  if (loading) return null;
  
  const hasAccess = allowedRoles.some(role => hasRole(role));
  
  return hasAccess ? children : fallback;
}

export default usePermissions;
