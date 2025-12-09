/**
 * Decorador @Public()
 *
 * Marca una ruta como pública, saltando la autenticación JWT.
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('status')
 * getStatus() {
 *   return { status: 'ok' };
 * }
 * ```
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
