/**
 * Decorador @CurrentUser()
 *
 * Extrae el usuario autenticado del request.
 * Solo funciona en rutas protegidas con JwtAuthGuard.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 *
 * // Obtener solo una propiedad
 * @Get('my-id')
 * getMyId(@CurrentUser('id') userId: string) {
 *   return { id: userId };
 * }
 * ```
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../dto/auth-response.dto';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // Si se especifica una propiedad, retornar solo esa
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
