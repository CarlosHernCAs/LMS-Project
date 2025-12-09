/**
 * Módulo de Instituciones (Tenants)
 *
 * Gestiona el sistema multi-tenant:
 * - CRUD de instituciones
 * - Middleware de resolución de tenant
 * - Guards y decoradores de tenant
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';

import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantGuard],
  exports: [TenantsService, TenantGuard],
})
export class TenantsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware a todas las rutas
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
