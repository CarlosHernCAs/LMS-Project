/**
 * Módulo RBAC (Role-Based Access Control)
 *
 * Provee guards y decoradores para control de acceso:
 * - @Roles() - Por rol
 * - @RequirePermissions() - Por permiso específico
 */

import { Module, Global } from '@nestjs/common';

import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  providers: [RolesGuard, PermissionsGuard],
  exports: [RolesGuard, PermissionsGuard],
})
export class RbacModule {}
