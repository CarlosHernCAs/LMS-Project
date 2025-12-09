/**
 * Decorador @Roles()
 *
 * Restringe acceso a usuarios con roles específicos.
 *
 * @example
 * ```typescript
 * @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
 * @Get('admin-data')
 * getAdminData() { ... }
 * ```
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
