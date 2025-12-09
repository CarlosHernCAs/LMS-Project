/**
 * Decoradores de Tenant
 */

import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUIRE_TENANT_KEY } from '../guards/tenant.guard';

/**
 * Marca una ruta como que requiere tenant
 *
 * @example
 * ```typescript
 * @RequireTenant()
 * @Get('students')
 * getStudents() { ... }
 * ```
 */
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);

/**
 * Extrae el tenant del request
 *
 * @example
 * ```typescript
 * @Get('data')
 * getData(@CurrentTenant() tenant: TenantInfo) {
 *   console.log(tenant.id, tenant.name);
 * }
 *
 * // O solo el ID
 * @Get('data')
 * getData(@CurrentTenant('id') tenantId: string) {
 *   console.log(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (data && tenant) {
      return tenant[data];
    }

    return tenant;
  },
);

/**
 * Extrae solo el ID del tenant
 */
export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenantId;
});
