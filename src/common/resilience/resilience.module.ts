import { Module, Global, DynamicModule } from '@nestjs/common';
import { ResilienceService } from './resilience.service';
import { CircuitBreakerHealthIndicator } from './circuit-breaker.health';

/**
 * Opciones de configuración del módulo de resiliencia
 */
export interface ResilienceModuleOptions {
  /** Configuración por defecto para circuit breakers */
  defaults?: {
    failureThreshold?: number;
    recoveryTimeout?: number;
    timeout?: number;
    successThreshold?: number;
  };
  /** Habilitar endpoint de métricas */
  enableMetricsEndpoint?: boolean;
}

/**
 * Módulo de Resiliencia
 *
 * Proporciona:
 * - Circuit Breakers
 * - Retry patterns
 * - Timeouts
 * - Graceful degradation
 * - Health checks para circuitos
 *
 * Uso:
 * ```typescript
 * @Module({
 *   imports: [
 *     ResilienceModule.forRoot({
 *       defaults: {
 *         failureThreshold: 5,
 *         recoveryTimeout: 30000,
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class ResilienceModule {
  static forRoot(options: ResilienceModuleOptions = {}): DynamicModule {
    return {
      module: ResilienceModule,
      providers: [
        {
          provide: 'RESILIENCE_OPTIONS',
          useValue: options,
        },
        ResilienceService,
        CircuitBreakerHealthIndicator,
      ],
      exports: [ResilienceService, CircuitBreakerHealthIndicator],
    };
  }
}
