import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  CircuitBreaker,
  CircuitBreakerOptions,
  CircuitState,
} from './circuit-breaker';
import { circuitBreakerRegistry } from './circuit-breaker.decorator';
import { ResilienceModuleOptions } from './resilience.module';

/**
 * Servicio central de resiliencia
 *
 * Permite:
 * - Crear circuit breakers programáticamente
 * - Obtener métricas de todos los circuitos
 * - Forzar estados para testing/admin
 * - Monitorear la salud del sistema
 */
@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);

  constructor(
    @Inject('RESILIENCE_OPTIONS')
    private readonly options: ResilienceModuleOptions,
  ) {}

  /**
   * Crea un nuevo circuit breaker
   */
  createCircuitBreaker(
    name: string,
    customOptions?: Partial<CircuitBreakerOptions>,
  ): CircuitBreaker {
    const existingCircuit = circuitBreakerRegistry.get(name);
    if (existingCircuit) {
      this.logger.warn(`Circuit breaker "${name}" already exists, returning existing instance`);
      return existingCircuit;
    }

    const circuitOptions: CircuitBreakerOptions = {
      name,
      failureThreshold:
        customOptions?.failureThreshold ??
        this.options.defaults?.failureThreshold ??
        5,
      recoveryTimeout:
        customOptions?.recoveryTimeout ??
        this.options.defaults?.recoveryTimeout ??
        30000,
      timeout:
        customOptions?.timeout ?? this.options.defaults?.timeout ?? 10000,
      successThreshold:
        customOptions?.successThreshold ??
        this.options.defaults?.successThreshold ??
        2,
    };

    const circuit = new CircuitBreaker(circuitOptions);
    circuitBreakerRegistry.register(name, circuit);
    this.logger.log(`Circuit breaker "${name}" created`);

    return circuit;
  }

  /**
   * Obtiene un circuit breaker existente
   */
  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return circuitBreakerRegistry.get(name);
  }

  /**
   * Obtiene métricas de todos los circuit breakers
   */
  getAllMetrics(): Record<string, ReturnType<CircuitBreaker['getMetrics']>> {
    return circuitBreakerRegistry.getAllMetrics();
  }

  /**
   * Obtiene un resumen del estado de salud de todos los circuitos
   */
  getHealthSummary(): {
    healthy: boolean;
    totalCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    circuits: Record<string, { state: CircuitState; healthy: boolean }>;
  } {
    const metrics = this.getAllMetrics();
    const circuits: Record<string, { state: CircuitState; healthy: boolean }> =
      {};

    let openCount = 0;
    let halfOpenCount = 0;
    let closedCount = 0;

    Object.entries(metrics).forEach(([name, metric]) => {
      circuits[name] = {
        state: metric.state,
        healthy: metric.state === CircuitState.CLOSED,
      };

      switch (metric.state) {
        case CircuitState.OPEN:
          openCount++;
          break;
        case CircuitState.HALF_OPEN:
          halfOpenCount++;
          break;
        case CircuitState.CLOSED:
          closedCount++;
          break;
      }
    });

    return {
      healthy: openCount === 0,
      totalCircuits: Object.keys(metrics).length,
      openCircuits: openCount,
      halfOpenCircuits: halfOpenCount,
      closedCircuits: closedCount,
      circuits,
    };
  }

  /**
   * Fuerza el estado de un circuito (para admin/testing)
   */
  forceCircuitState(name: string, state: CircuitState): boolean {
    const circuit = circuitBreakerRegistry.get(name);
    if (!circuit) {
      this.logger.warn(`Circuit breaker "${name}" not found`);
      return false;
    }

    circuit.forceState(state);
    this.logger.warn(`Circuit breaker "${name}" forced to ${state}`);
    return true;
  }

  /**
   * Resetea un circuito
   */
  resetCircuit(name: string): boolean {
    const circuit = circuitBreakerRegistry.get(name);
    if (!circuit) {
      return false;
    }

    circuit.reset();
    this.logger.log(`Circuit breaker "${name}" reset`);
    return true;
  }

  /**
   * Resetea todos los circuitos
   */
  resetAllCircuits(): void {
    const circuits = circuitBreakerRegistry.getAll();
    circuits.forEach((circuit, name) => {
      circuit.reset();
      this.logger.log(`Circuit breaker "${name}" reset`);
    });
  }
}
