/**
 * Guard de Permisos
 *
 * Verifica que el usuario tenga los permisos necesarios.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, DEFAULT_ROLE_PERMISSIONS } from '../rbac.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener permisos requeridos del decorador
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obtener usuario del request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    // Obtener permisos del rol del usuario
    const userPermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];

    // Verificar si tiene todos los permisos requeridos
    const tieneTodosLosPermisos = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!tieneTodosLosPermisos) {
      const permisosQueFaltan = requiredPermissions.filter(
        (p) => !userPermissions.includes(p),
      );
      throw new ForbiddenException(
        `No tiene los permisos necesarios: ${permisosQueFaltan.join(', ')}`,
      );
    }

    return true;
  }
}
