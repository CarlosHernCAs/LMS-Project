import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { circuitBreakerRegistry } from './circuit-breaker.decorator';
import { CircuitState } from './circuit-breaker';

/**
 * Health Indicator para Circuit Breakers
 *
 * Se integra con @nestjs/terminus para reportar
 * el estado de los circuit breakers en el health check
 *
 * Uso:
 * ```typescript
 * @Controller('health')
 * export class HealthController {
 *   constructor(
 *     private health: HealthCheckService,
 *     private circuitHealth: CircuitBreakerHealthIndicator,
 *   ) {}
 *
 *   @Get()
 *   check() {
 *     return this.health.check([
 *       () => this.circuitHealth.checkAll('circuits'),
 *     ]);
 *   }
 * }
 * ```
 */
@Injectable()
export class CircuitBreakerHealthIndicator extends HealthIndicator {
  /**
   * Verifica un circuito específico
   */
  checkCircuit(key: string, circuitName: string): HealthIndicatorResult {
    const circuit = circuitBreakerRegistry.get(circuitName);

    if (!circuit) {
      throw new HealthCheckError(
        `Circuit "${circuitName}" not found`,
        this.getStatus(key, false, { error: 'Circuit not found' }),
      );
    }

    const metrics = circuit.getMetrics();
    const isHealthy = metrics.state === CircuitState.CLOSED;

    const result = this.getStatus(key, isHealthy, {
      state: metrics.state,
      failures: metrics.failures,
      totalCalls: metrics.totalCalls,
      successRate:
        metrics.totalCalls > 0
          ? ((metrics.totalSuccesses / metrics.totalCalls) * 100).toFixed(2) +
            '%'
          : 'N/A',
    });

    if (!isHealthy) {
      throw new HealthCheckError(`Circuit "${circuitName}" is ${metrics.state}`, result);
    }

    return result;
  }

  /**
   * Verifica todos los circuitos
   */
  checkAll(key: string): HealthIndicatorResult {
    const allMetrics = circuitBreakerRegistry.getAllMetrics();
    const circuits: Record<
      string,
      { state: CircuitState; healthy: boolean; failures: number }
    > = {};

    let allHealthy = true;

    Object.entries(allMetrics).forEach(([name, metrics]) => {
      const isHealthy = metrics.state === CircuitState.CLOSED;
      if (!isHealthy) {
        allHealthy = false;
      }

      circuits[name] = {
        state: metrics.state,
        healthy: isHealthy,
        failures: metrics.failures,
      };
    });

    const result = this.getStatus(key, allHealthy, {
      totalCircuits: Object.keys(circuits).length,
      circuits,
    });

    if (!allHealthy) {
      throw new HealthCheckError('One or more circuits are not healthy', result);
    }

    return result;
  }

  /**
   * Verifica circuitos críticos (no falla si hay circuitos degradados no críticos)
   */
  checkCritical(
    key: string,
    criticalCircuits: string[],
  ): HealthIndicatorResult {
    const circuits: Record<string, { state: CircuitState; healthy: boolean }> =
      {};
    let allCriticalHealthy = true;

    for (const circuitName of criticalCircuits) {
      const circuit = circuitBreakerRegistry.get(circuitName);

      if (!circuit) {
        circuits[circuitName] = {
          state: CircuitState.OPEN,
          healthy: false,
        };
        allCriticalHealthy = false;
        continue;
      }

      const metrics = circuit.getMetrics();
      const isHealthy = metrics.state === CircuitState.CLOSED;

      circuits[circuitName] = {
        state: metrics.state,
        healthy: isHealthy,
      };

      if (!isHealthy) {
        allCriticalHealthy = false;
      }
    }

    const result = this.getStatus(key, allCriticalHealthy, {
      criticalCircuits: circuits,
    });

    if (!allCriticalHealthy) {
      throw new HealthCheckError('One or more critical circuits are not healthy', result);
    }

    return result;
  }
}
