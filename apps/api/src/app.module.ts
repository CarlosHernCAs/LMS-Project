import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration } from './config';

// Resilience
import { ResilienceModule } from './common/resilience';

// Database
import { DatabaseModule } from './database/database.module';

// Feature Modules
import { HealthModule } from './modules/health/health.module';
import { ReportsModule } from './modules/reports/reports.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { TenantsModule } from './modules/tenants/tenants.module';
// import { AcademicModule } from './modules/academic/academic.module';
// import { GradesModule } from './modules/grades/grades.module';
// import { AttendanceModule } from './modules/attendance/attendance.module';
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

    // Módulos de negocio
    ReportsModule,
    // AuthModule,
    // UsersModule,
    // TenantsModule,
    // AcademicModule,
    // GradesModule,
    // AttendanceModule,
    // ContentModule,
    // MessagingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // Middlewares globales
    // consumer.apply(TenantMiddleware).forRoutes('*');
    // consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
