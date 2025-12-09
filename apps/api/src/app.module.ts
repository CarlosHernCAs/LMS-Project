import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { configuration } from './config';

// Resilience
import { ResilienceModule } from './common/resilience';

// Database
import { DatabaseModule } from './database/database.module';

// Feature Modules
import { HealthModule } from './modules/health/health.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuthModule, JwtAuthGuard } from './modules/auth';
import { UsersModule } from './modules/users';
import { TenantsModule, TenantMiddleware } from './modules/tenants';
import { RbacModule, RolesGuard, PermissionsGuard } from './modules/rbac';
import { AcademicModule } from './modules/academic';
import { GradesModule } from './modules/grades';
import { AttendanceModule } from './modules/attendance';
import { DashboardModule } from './modules/dashboard';
// import { ContentModule } from './modules/content/content.module';
// import { MessagingModule } from './modules/messaging/messaging.module';

/**
 * Módulo Principal de la Aplicación LMS
 *
 * ARQUITECTURA MODULAR CON TOLERANCIA A FALLOS
 *
 * Módulos Críticos (si fallan, afectan el sistema):
 * - AuthModule
 * - UsersModule
 * - TenantsModule
 * - AcademicModule
 * - GradesModule
 *
 * Módulos Degradables (si fallan, el resto sigue):
 * - ReportsModule
 * - AttendanceModule
 * - ContentModule
 * - MessagingModule
 */
@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Base de datos
    DatabaseModule,

    // Sistema de resiliencia (debe ser temprano)
    ResilienceModule.forRoot({
      defaults: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        timeout: 10000,
        successThreshold: 2,
      },
      enableMetricsEndpoint: true,
    }),

    // Health checks (siempre disponible)
    HealthModule,

    // Módulos core de negocio
    AuthModule,
    UsersModule,
    TenantsModule,
    RbacModule,
    AcademicModule,
    GradesModule,

    // Módulos degradables (si fallan, el resto continúa)
    ReportsModule,
    AttendanceModule,
    DashboardModule,
    // ContentModule,
    // MessagingModule,
  ],
  controllers: [],
  providers: [
    // Guards globales (orden importa: Auth -> Roles -> Permissions)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware de tenant para resolución multi-tenancy
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
