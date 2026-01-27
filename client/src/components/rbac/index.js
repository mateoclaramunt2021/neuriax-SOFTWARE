/**
 * PASO 10 - RBAC Components Index
 * Exporta todos los componentes de Control de Acceso
 */

export { default as RBACDashboard } from './RBACDashboard';
export { default as RoleManager } from './RoleManager';
export { default as PermissionMatrix } from './PermissionMatrix';
export { default as UserRoleAssignment } from './UserRoleAssignment';
export { default as AuditLog } from './AuditLog';

// Re-export from hooks
export { 
  usePermissions,
  PermissionsProvider,
  useCanAccess,
  useModuleAccess,
  withPermission,
  Can,
  RoleGate
} from '../../hooks/usePermissions';

// Re-export from common
export {
  ProtectedRoute,
  AdminRoute,
  OwnerRoute,
  FeatureRoute
} from '../common/ProtectedRoute';
