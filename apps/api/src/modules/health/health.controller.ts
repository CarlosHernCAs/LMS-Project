import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import {
  CircuitBreakerHealthIndicator,
  ResilienceService,
} from '../../common/resilience';

/**
 * Controlador de Health Checks
 *
 * Proporciona endpoints para monitorear la salud del sistema.
 * Distingue entre:
 * - Servicios críticos (si fallan, el sistema no funciona)
 * - Servicios degradables (si fallan, el sistema sigue con funcionalidad reducida)
 */
@Controller('health')
export class HealthController {
  // Circuitos críticos que deben estar saludables
  private readonly criticalCircuits = [
    'auth-service',
    'database-connection',
  ];

  // Circuitos que pueden degradarse sin afectar el sistema
  private readonly degradableCircuits = [
    'reports-grades',
    'reports-pdf-export',
    'analytics-service',
    'notification-service',
  ];

  constructor(
    private health: HealthCheckService,
    private circuitHealth: CircuitBreakerHealthIndicator,
    private resilienceService: ResilienceService,
    // Estos se inyectan si tienes TypeORM configurado
    // private db: TypeOrmHealthIndicator,
    // private memory: MemoryHealthIndicator,
    // private disk: DiskHealthIndicator,
  ) {}

  /**
   * Health check básico
   *
   * GET /health
   *
   * Retorna el estado general del sistema.
   * Útil para load balancers y kubernetes probes.
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Verificar solo circuitos críticos
      () => this.circuitHealth.checkCritical('critical-circuits', this.criticalCircuits),

      // Verificar memoria
      // () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB

      // Verificar disco
      // () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),

      // Verificar base de datos
      // () => this.db.pingCheck('database'),
    ]);
  }

  /**
   * Health check detallado
   *
   * GET /health/detailed
   *
   * Incluye el estado de todos los servicios, incluyendo degradables.
   */
  @Get('detailed')
  async detailedCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
    critical: ReturnType<ResilienceService['getHealthSummary']>;
    degradable: ReturnType<ResilienceService['getHealthSummary']>;
    message: string;
  }> {
    const criticalStatus = this.resilienceService.getHealthSummary();

    // Determinar estado general
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'All systems operational';

    const openCritical = Object.entries(criticalStatus.circuits)
      .filter(
        ([name, info]) =>
          this.criticalCircuits.includes(name) && !info.healthy,
      )
      .map(([name]) => name);

    const openDegradable = Object.entries(criticalStatus.circuits)
      .filter(
        ([name, info]) =>
          this.degradableCircuits.includes(name) && !info.healthy,
      )
      .map(([name]) => name);

    if (openCritical.length > 0) {
      status = 'unhealthy';
      message = `Critical services failing: ${openCritical.join(', ')}`;
    } else if (openDegradable.length > 0) {
      status = 'degraded';
      message = `System operational with degraded services: ${openDegradable.join(', ')}`;
    }

    return {
      status,
      timestamp: new Date(),
      uptime: process.uptime(),
      critical: criticalStatus,
      degradable: criticalStatus,
      message,
    };
  }

  /**
   * Estado de los circuit breakers
   *
   * GET /health/circuits
   *
   * Muestra métricas detalladas de cada circuit breaker.
   */
  @Get('circuits')
  async getCircuitStatus(): Promise<
    ReturnType<ResilienceService['getAllMetrics']>
  > {
    return this.resilienceService.getAllMetrics();
  }

  /**
   * Liveness probe para Kubernetes
   *
   * GET /health/live
   *
   * Siempre retorna 200 si el proceso está corriendo.
   */
  @Get('live')
  live(): { status: 'alive'; timestamp: Date } {
    return {
      status: 'alive',
      timestamp: new Date(),
    };
  }

  /**
   * Readiness probe para Kubernetes
   *
   * GET /health/ready
   *
   * Retorna 200 solo si los servicios críticos están listos.
   */
  @Get('ready')
  async ready(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    const summary = this.resilienceService.getHealthSummary();

    const checks: Record<string, boolean> = {};
    let allReady = true;

    for (const circuitName of this.criticalCircuits) {
      const circuit = summary.circuits[circuitName];
      checks[circuitName] = circuit?.healthy ?? false;
      if (!checks[circuitName]) {
        allReady = false;
      }
    }

    return {
      ready: allReady,
      checks,
    };
  }
}
