// Módulo
export { RbacModule } from './rbac.module';

// Guards
export { RolesGuard } from './guards/roles.guard';
export { PermissionsGuard } from './guards/permissions.guard';

// Decoradores
export { Roles, ROLES_KEY } from './decorators/roles.decorator';
export { RequirePermissions, PERMISSIONS_KEY } from './decorators/permissions.decorator';

// Constantes
export {
  PERMISSIONS,
  SCOPES,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  canManageRole,
  Permission,
  Scope,
} from './rbac.constants';
