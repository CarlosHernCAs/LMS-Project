/**
 * Circuit Breaker Pattern Implementation
 *
 * Estados:
 * - CLOSED: Todo funciona normal, las llamadas pasan
 * - OPEN: El servicio falló, las llamadas retornan fallback inmediatamente
 * - HALF_OPEN: Probando si el servicio se recuperó
 *
 * Flujo:
 * 1. Llamadas normales (CLOSED)
 * 2. Si fallan X veces consecutivas → OPEN
 * 3. Después de Y segundos → HALF_OPEN (prueba)
 * 4. Si la prueba funciona → CLOSED
 * 5. Si la prueba falla → OPEN de nuevo
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Nombre del circuito para logging */
  name: string;
  /** Número de fallos antes de abrir el circuito */
  failureThreshold: number;
  /** Tiempo en ms antes de intentar recuperar (HALF_OPEN) */
  recoveryTimeout: number;
  /** Tiempo en ms máximo para esperar una operación */
  timeout: number;
  /** Número de éxitos necesarios en HALF_OPEN para cerrar */
  successThreshold: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  /**
   * Ejecuta una función con protección del circuit breaker
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>,
  ): Promise<T> {
    this.totalCalls++;

    // Si el circuito está ABIERTO, verificar si podemos pasar a HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        // Circuito abierto, usar fallback
        return this.handleFallback(fallback, 'Circuit is OPEN');
      }
    }

    try {
      // Ejecutar con timeout
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return this.handleFallback(fallback, error);
    }
  }

  /**
   * Ejecuta la operación con un timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Maneja el caso cuando necesitamos usar el fallback
   */
  private async handleFallback<T>(
    fallback?: () => T | Promise<T>,
    error?: unknown,
  ): Promise<T> {
    if (fallback) {
      console.warn(
        `[CircuitBreaker:${this.options.name}] Using fallback. Reason: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return fallback();
    }

    throw new CircuitBreakerError(
      this.options.name,
      this.state,
      error instanceof Error ? error.message : 'Operation failed',
    );
  }

  /**
   * Registra un éxito
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.totalSuccesses++;
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Registra un fallo
   */
  private onFailure(error: unknown): void {
    this.lastFailureTime = new Date();
    this.totalFailures++;
    this.failures++;
    this.successes = 0;

    console.error(
      `[CircuitBreaker:${this.options.name}] Failure #${this.failures}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Un fallo en HALF_OPEN vuelve a abrir el circuito
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Verifica si debemos intentar recuperar el servicio
   */
  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) return true;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.options.recoveryTimeout;
  }

  /**
   * Transición de estado
   */
  private transitionTo(newState: CircuitState): void {
    console.log(
      `[CircuitBreaker:${this.options.name}] State transition: ${this.state} → ${newState}`,
    );
    this.state = newState;

    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successes = 0;
    }
  }

  /**
   * Obtiene las métricas actuales del circuit breaker
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime,
      lastSuccess: this.lastSuccessTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Fuerza el estado del circuito (útil para testing o admin)
   */
  forceState(state: CircuitState): void {
    console.warn(
      `[CircuitBreaker:${this.options.name}] Force state: ${this.state} → ${state}`,
    );
    this.transitionTo(state);
  }

  /**
   * Resetea el circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.totalCalls = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
  }
}

/**
 * Error específico del Circuit Breaker
 */
export class CircuitBreakerError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly circuitState: CircuitState,
    public readonly originalMessage: string,
  ) {
    super(
      `Circuit "${circuitName}" is ${circuitState}. Original error: ${originalMessage}`,
    );
    this.name = 'CircuitBreakerError';
  }
}
