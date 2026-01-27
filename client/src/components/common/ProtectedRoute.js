/**
 * PASO 10 - ProtectedRoute Component
 * Componente para proteger rutas basado en permisos RBAC
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import './ProtectedRoute.css';

// ============================================================
// PROTECTED ROUTE - Por Permiso
// ============================================================

export function ProtectedRoute({ 
  children, 
  permission,
  permissions,
  any = false,
  roles,
  redirectTo = '/login',
  showAccessDenied = true
}) {
  const location = useLocation();
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole,
    loading 
  } = usePermissions();

  // Verificar autenticación básica
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Mostrar loading mientras se verifican permisos
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  // Verificar permisos
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = any ? hasAnyPermission(permissions) : hasAllPermissions(permissions);
  }

  // Verificar roles si se especifican
  if (hasAccess && roles && roles.length > 0) {
    hasAccess = roles.some(role => hasRole(role));
  }

  // Sin acceso
  if (!hasAccess) {
    if (showAccessDenied) {
      return <AccessDenied permission={permission} permissions={permissions} />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ============================================================
// ADMIN ONLY ROUTE
// ============================================================

export function AdminRoute({ children, redirectTo = '/dashboard' }) {
  const { hasRole, loading } = usePermissions();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Verificar si es admin
  const isAdmin = user.rol === 'administrador' || 
                  user.rol === 'admin' || 
                  hasRole('admin') || 
                  hasRole('super_admin') ||
                  hasRole('owner');

  if (!isAdmin) {
    return (
      <AccessDenied 
        title="Acceso Solo Administradores"
        message="Esta sección está reservada para administradores del sistema."
      />
    );
  }

  return children;
}

// ============================================================
// OWNER ONLY ROUTE
// ============================================================

export function OwnerRoute({ children }) {
  const { hasRole, loading } = usePermissions();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  const isOwner = user.rol === 'owner' || hasRole('owner') || hasRole('super_admin');

  if (!isOwner) {
    return (
      <AccessDenied 
        title="Acceso Solo Propietarios"
        message="Esta sección está reservada para el propietario del negocio."
      />
    );
  }

  return children;
}

// ============================================================
// ACCESS DENIED COMPONENT
// ============================================================

function AccessDenied({ 
  permission, 
  permissions, 
  title = "Acceso Denegado",
  message = "No tienes permisos para acceder a esta sección."
}) {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="access-denied">
      <div className="access-denied-content">
        <div className="access-denied-icon">
          <span>🔒</span>
        </div>
        <h1>{title}</h1>
        <p>{message}</p>
        
        {(permission || permissions) && (
          <div className="access-denied-details">
            <p className="required-permissions">
              <strong>Permisos requeridos:</strong>
            </p>
            <ul>
              {permission && <li><code>{permission}</code></li>}
              {permissions && permissions.map((p, i) => (
                <li key={i}><code>{p}</code></li>
              ))}
            </ul>
          </div>
        )}

        <div className="access-denied-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            ← Volver
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            Ir al Dashboard
          </button>
        </div>

        <div className="access-denied-help">
          <p>
            <span>💡</span>
            Si crees que deberías tener acceso, contacta con tu administrador.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE FLAG ROUTE
// ============================================================

export function FeatureRoute({ 
  children, 
  feature, 
  fallback = null 
}) {
  const [enabled, setEnabled] = React.useState(null);

  React.useEffect(() => {
    // Verificar si la feature está habilitada
    const checkFeature = async () => {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/features/${feature}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setEnabled(data.enabled || false);
      } catch {
        setEnabled(false);
      }
    };

    checkFeature();
  }, [feature]);

  if (enabled === null) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!enabled) {
    return fallback || (
      <div className="feature-disabled">
        <span>🚧</span>
        <h2>Función en desarrollo</h2>
        <p>Esta funcionalidad estará disponible próximamente.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
