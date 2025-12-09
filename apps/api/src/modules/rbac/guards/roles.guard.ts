/**
 * Guard de Roles
 *
 * Verifica que el usuario tenga uno de los roles requeridos.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLE_HIERARCHY } from '../rbac.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    // o un rol con mayor jerarquía
    const tieneRol = requiredRoles.some((requiredRole) => {
      // Coincidencia exacta
      if (user.role === requiredRole) {
        return true;
      }

      // O rol con mayor jerarquía
      return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
    });

    if (!tieneRol) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
