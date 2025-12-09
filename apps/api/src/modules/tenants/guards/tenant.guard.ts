/**
 * Guard de Tenant
 *
 * Verifica que el request tenga un tenant válido.
 * Usar con @RequireTenant() decorator.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_TENANT_KEY = 'requireTenant';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si la ruta requiere tenant
    const requireTenant = this.reflector.getAllAndOverride<boolean>(REQUIRE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se requiere explícitamente, permitir
    if (!requireTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Verificar que hay tenant en el request
    if (!request.tenantId) {
      throw new BadRequestException(
        'Se requiere especificar la institución. ' +
          'Use el header X-Tenant-Id o acceda desde el subdominio de su institución.',
      );
    }

    return true;
  }
}
