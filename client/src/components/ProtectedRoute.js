/**
 * ProtectedRoute - Componente para proteger rutas según tipoUsuario
 * Valida que el usuario está autenticado y tiene el tipo correcto
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ 
  children, 
  requiredRole = null,
  redirectTo = '/'
}) {
  const { isAuthenticated, usuario, cargando } = useAuth();

  // Si está cargando, mostrar loading
  if (cargando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem'
      }}>
        ⏳ Cargando...
      </div>
    );
  }

  // Si no está autenticado, redirigir a inicio
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si requiere un rol específico, validar
  if (requiredRole) {
    const userRole = localStorage.getItem('tipoUsuario');
    
    if (!userRole || userRole !== requiredRole) {
      // Si tiene role pero es diferente, redirigir a su dashboard correspondiente
      if (userRole === 'profesional') {
        return <Navigate to="/dashboard/profesional" replace />;
      } else if (userRole === 'cliente') {
        return <Navigate to="/dashboard/cliente" replace />;
      }
      
      // Si no tiene role, redirigir a selector de rol
      return <Navigate to="/role-select" replace />;
    }
  }

  // Si todo está bien, mostrar el componente
  return children;
}
