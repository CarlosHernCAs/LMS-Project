import { CircuitBreaker, CircuitBreakerOptions } from './circuit-breaker';

/**
 * Registry global de Circuit Breakers
 * Permite monitorear todos los circuitos desde un solo lugar
 */
class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private circuits: Map<string, CircuitBreaker> = new Map();

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  register(name: string, circuit: CircuitBreaker): void {
    this.circuits.set(name, circuit);
  }

  get(name: string): CircuitBreaker | undefined {
    return this.circuits.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return this.circuits;
  }

  getAllMetrics(): Record<string, ReturnType<CircuitBreaker['getMetrics']>> {
    const metrics: Record<string, ReturnType<CircuitBreaker['getMetrics']>> = {};
    this.circuits.forEach((circuit, name) => {
      metrics[name] = circuit.getMetrics();
    });
    return metrics;
  }
}

export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();

/**
 * Opciones para el decorador
 */
export interface CircuitBreakerDecoratorOptions {
  /** Nombre único del circuito */
  name: string;
  /** Número de fallos antes de abrir (default: 5) */
  failureThreshold?: number;
  /** Tiempo en ms antes de intentar recuperar (default: 30000) */
  recoveryTimeout?: number;
  /** Timeout de la operación en ms (default: 10000) */
  timeout?: number;
  /** Éxitos necesarios para cerrar (default: 2) */
  successThreshold?: number;
  /** Función fallback que retorna un valor por defecto */
  fallback?: (...args: unknown[]) => unknown;
}

/**
 * Decorador @UseCircuitBreaker
 *
 * Uso:
 * ```typescript
 * @UseCircuitBreaker({
 *   name: 'reports-service',
 *   failureThreshold: 3,
 *   fallback: () => ({ status: 'unavailable', data: [] })
 * })
 * async generateReport(params: ReportParams) {
 *   // ... operación que puede fallar
 * }
 * ```
 */
export function UseCircuitBreaker(options: CircuitBreakerDecoratorOptions) {
  const circuitOptions: CircuitBreakerOptions = {
    name: options.name,
    failureThreshold: options.failureThreshold ?? 5,
    recoveryTimeout: options.recoveryTimeout ?? 30000,
    timeout: options.timeout ?? 10000,
    successThreshold: options.successThreshold ?? 2,
  };

  // Obtener o crear el circuit breaker
  let circuit = circuitBreakerRegistry.get(options.name);
  if (!circuit) {
    circuit = new CircuitBreaker(circuitOptions);
    circuitBreakerRegistry.register(options.name, circuit);
  }

  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const fallbackFn = options.fallback
        ? () => options.fallback!(...args)
        : undefined;

      return circuit!.execute(
        () => originalMethod.apply(this, args),
        fallbackFn,
      );
    };

    // Preservar metadata para NestJS
    Object.defineProperty(descriptor.value, 'name', {
      value: propertyKey,
      writable: false,
    });

    return descriptor;
  };
}

/**
 * Decorador para métodos que deben degradarse gracefully
 * Similar a @UseCircuitBreaker pero más simple, solo captura errores
 *
 * Uso:
 * ```typescript
 * @GracefulDegradation(() => [])
 * async getOptionalData() {
 *   // Si falla, retorna []
 * }
 * ```
 */
export function GracefulDegradation<T>(fallbackValue: () => T) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.warn(
          `[GracefulDegradation:${propertyKey}] Method failed, using fallback. Error: ${
            error instanceof Error ? error.message : 'Unknown'
          }`,
        );
        return fallbackValue();
      }
    };

    return descriptor;
  };
}

/**
 * Decorador @Timeout
 * Añade un timeout a cualquier método async
 *
 * Uso:
 * ```typescript
 * @Timeout(5000)
 * async slowOperation() {
 *   // Falla si tarda más de 5 segundos
 * }
 * ```
 */
export function Timeout(ms: number) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return Promise.race([
        originalMethod.apply(this, args),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`${propertyKey} timed out after ${ms}ms`)),
            ms,
          ),
        ),
      ]);
    };

    return descriptor;
  };
}

/**
 * Decorador @Retry
 * Reintenta una operación X veces antes de fallar
 *
 * Uso:
 * ```typescript
 * @Retry({ attempts: 3, delay: 1000, backoff: 'exponential' })
 * async unreliableOperation() {
 *   // Se reintenta hasta 3 veces
 * }
 * ```
 */
export interface RetryOptions {
  /** Número máximo de intentos */
  attempts: number;
  /** Delay inicial en ms entre intentos */
  delay: number;
  /** Tipo de backoff */
  backoff?: 'fixed' | 'exponential' | 'linear';
  /** Función para determinar si el error es retriable */
  retryIf?: (error: Error) => boolean;
}

export function Retry(options: RetryOptions) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= options.attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Verificar si debemos reintentar
          if (options.retryIf && !options.retryIf(lastError)) {
            throw lastError;
          }

          // Si es el último intento, no esperar
          if (attempt === options.attempts) {
            break;
          }

          // Calcular delay según el tipo de backoff
          let delay = options.delay;
          switch (options.backoff) {
            case 'exponential':
              delay = options.delay * Math.pow(2, attempt - 1);
              break;
            case 'linear':
              delay = options.delay * attempt;
              break;
            // 'fixed' o default: usar el delay base
          }

          console.log(
            `[Retry:${propertyKey}] Attempt ${attempt}/${options.attempts} failed. ` +
              `Retrying in ${delay}ms. Error: ${lastError.message}`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
