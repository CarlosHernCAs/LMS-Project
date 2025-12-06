import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Resilience
import { ResilienceModule } from './common/resilience';

// Feature Modules
import { HealthModule } from './modules/health/health.module';
import { ReportsModule } from './modules/reports/reports.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { AcademicModule } from './modules/academic/academic.module';
// import { GradesModule } from './modules/grades/grades.module';
// import { AttendanceModule } from './modules/attendance/attendance.module';
// import { ContentModule } from './modules/content/content.module';
// import { MessagingModule } from './modules/messaging/messaging.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';

/**
 * Módulo Principal de la Aplicación LMS
 *
 * ARQUITECTURA DE TOLERANCIA A FALLOS:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         APP MODULE                              │
 * │                                                                  │
 * │  ┌──────────────────────────────────────────────────────────┐  │
 * │  │                  RESILIENCE MODULE                        │  │
 * │  │  • Circuit Breakers    • Bulkheads                        │  │
 * │  │  • Retry Logic         • Timeouts                         │  │
 * │  │  • Health Indicators   • Metrics                          │  │
 * │  └──────────────────────────────────────────────────────────┘  │
 * │                              │                                   │
 * │  ┌───────────┬───────────┬──┴────────┬───────────┬──────────┐  │
 * │  │           │           │           │           │          │  │
 * │  │   AUTH    │  ACADEMIC │  GRADES   │  REPORTS  │  HEALTH  │  │
 * │  │  MODULE   │  MODULE   │  MODULE   │  MODULE   │  MODULE  │  │
 * │  │           │           │           │           │          │  │
 * │  │  ┌─────┐  │  ┌─────┐  │  ┌─────┐  │  ┌─────┐  │          │  │
 * │  │  │ CB  │  │  │ CB  │  │  │ CB  │  │  │ CB  │  │          │  │
 * │  │  └─────┘  │  └─────┘  │  └─────┘  │  └─────┘  │          │  │
 * │  │           │           │           │           │          │  │
 * │  │ CRITICAL  │  CRITICAL │  CRITICAL │ DEGRADABLE│          │  │
 * │  │           │           │           │           │          │  │
 * │  └───────────┴───────────┴───────────┴───────────┴──────────┘  │
 * │                                                                  │
 * │  Si REPORTS falla:                                              │
 * │  ✓ AUTH sigue funcionando                                       │
 * │  ✓ ACADEMIC sigue funcionando                                   │
 * │  ✓ GRADES sigue funcionando                                     │
 * │  ✓ El sistema muestra "Reportes no disponibles"                 │
 * │                                                                  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * CB = Circuit Breaker
 */
@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Sistema de resiliencia (debe ser el primero)
    ResilienceModule.forRoot({
      defaults: {
        failureThreshold: 5,      // Fallos antes de abrir circuito
        recoveryTimeout: 30000,   // 30s antes de intentar recuperar
        timeout: 10000,           // 10s timeout por operación
        successThreshold: 2,      // Éxitos para cerrar circuito
      },
      enableMetricsEndpoint: true,
    }),

    // Health checks (siempre disponible)
    HealthModule,

    // Módulos de negocio
    // Cada uno tiene su propio circuit breaker
    ReportsModule,    // Degradable - si falla, el resto sigue
    // AuthModule,    // Crítico - si falla, usuarios no pueden entrar
    // AcademicModule,// Crítico - gestión académica
    // GradesModule,  // Crítico - registro de notas
    // AttendanceModule, // Degradable
    // ContentModule, // Degradable
    // MessagingModule,  // Degradable
    // NotificationsModule, // Degradable
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // Middlewares globales si es necesario
    // consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
