/**
 * Decorador @RequirePermissions()
 *
 * Restringe acceso a usuarios con permisos específicos.
 *
 * @example
 * ```typescript
 * @RequirePermissions(PERMISSIONS.GRADES_CREATE, PERMISSIONS.GRADES_UPDATE)
 * @Post('grades')
 * createGrade() { ... }
 * ```
 */

import { SetMetadata } from '@nestjs/common';
import { Permission } from '../rbac.constants';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
