/**
 * Guard de Autenticación JWT
 *
 * Protege las rutas que requieren autenticación.
 * Usa la estrategia JWT de Passport.
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina si la ruta requiere autenticación
   *
   * Verifica el decorador @Public() para saltar autenticación
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Verificar si la ruta es pública
    const esPublica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es pública, permitir acceso sin token
    if (esPublica) {
      return true;
    }

    // De lo contrario, validar JWT
    return super.canActivate(context);
  }
}
