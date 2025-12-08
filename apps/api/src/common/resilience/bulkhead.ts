/**
 * Bulkhead Pattern Implementation
 *
 * El patrón Bulkhead (mamparo de barco) aísla recursos entre diferentes
 * partes del sistema. Si un compartimento se inunda, los otros siguen a flote.
 *
 * En software:
 * - Limita el número de operaciones concurrentes por servicio
 * - Evita que un servicio lento consuma todos los recursos
 * - Proporciona aislamiento de fallos
 *
 * Ejemplo:
 * - Máximo 10 reportes generándose simultáneamente
 * - Máximo 5 exportaciones PDF al mismo tiempo
 * - Si se alcanza el límite, las nuevas solicitudes esperan o fallan
 */

export interface BulkheadOptions {
  /** Nombre del bulkhead para identificación */
  name: string;
  /** Número máximo de ejecuciones concurrentes */
  maxConcurrent: number;
  /** Número máximo de solicitudes en cola */
  maxQueue: number;
  /** Tiempo máximo en cola antes de rechazar (ms) */
  queueTimeout: number;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  enqueuedAt: number;
}

export interface BulkheadMetrics {
  name: string;
  activeCount: number;
  queuedCount: number;
  maxConcurrent: number;
  maxQueue: number;
  totalExecuted: number;
  totalRejected: number;
  totalTimedOut: number;
}

export class Bulkhead {
  private activeCount = 0;
  private queue: QueuedRequest<unknown>[] = [];
  private totalExecuted = 0;
  private totalRejected = 0;
  private totalTimedOut = 0;

  constructor(private readonly options: BulkheadOptions) {}

  /**
   * Ejecuta una operación dentro del bulkhead
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Si hay capacidad, ejecutar inmediatamente
    if (this.activeCount < this.options.maxConcurrent) {
      return this.executeOperation(operation);
    }

    // Si la cola está llena, rechazar
    if (this.queue.length >= this.options.maxQueue) {
      this.totalRejected++;
      throw new BulkheadRejectError(
        this.options.name,
        'Queue is full',
        this.getMetrics(),
      );
    }

    // Encolar y esperar
    return this.enqueue(operation);
  }

  /**
   * Intenta ejecutar sin encolar (falla inmediatamente si no hay capacidad)
   */
  async tryExecute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.options.maxConcurrent) {
      this.totalRejected++;
      throw new BulkheadRejectError(
        this.options.name,
        'No capacity available',
        this.getMetrics(),
      );
    }

    return this.executeOperation(operation);
  }

  /**
   * Ejecuta la operación y maneja el contador
   */
  private async executeOperation<T>(operation: () => Promise<T>): Promise<T> {
    this.activeCount++;

    try {
      const result = await operation();
      this.totalExecuted++;
      return result;
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  /**
   * Encola una operación
   */
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        execute: operation,
        resolve: resolve as (value: unknown) => void,
        reject,
        enqueuedAt: Date.now(),
      };

      this.queue.push(request as QueuedRequest<unknown>);

      // Timeout para la cola
      setTimeout(() => {
        const index = this.queue.indexOf(request as QueuedRequest<unknown>);
        if (index !== -1) {
          this.queue.splice(index, 1);
          this.totalTimedOut++;
          reject(
            new BulkheadTimeoutError(
              this.options.name,
              this.options.queueTimeout,
            ),
          );
        }
      }, this.options.queueTimeout);
    });
  }

  /**
   * Procesa la cola cuando hay capacidad disponible
   */
  private processQueue(): void {
    if (
      this.queue.length === 0 ||
      this.activeCount >= this.options.maxConcurrent
    ) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    // Verificar si el request expiró mientras esperaba
    const waitTime = Date.now() - request.enqueuedAt;
    if (waitTime >= this.options.queueTimeout) {
      this.totalTimedOut++;
      request.reject(
        new BulkheadTimeoutError(this.options.name, this.options.queueTimeout),
      );
      this.processQueue(); // Procesar el siguiente
      return;
    }

    // Ejecutar el request
    this.executeOperation(request.execute)
      .then(request.resolve)
      .catch(request.reject);
  }

  /**
   * Obtiene métricas del bulkhead
   */
  getMetrics(): BulkheadMetrics {
    return {
      name: this.options.name,
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      maxConcurrent: this.options.maxConcurrent,
      maxQueue: this.options.maxQueue,
      totalExecuted: this.totalExecuted,
      totalRejected: this.totalRejected,
      totalTimedOut: this.totalTimedOut,
    };
  }

  /**
   * Verifica si hay capacidad disponible
   */
  hasCapacity(): boolean {
    return this.activeCount < this.options.maxConcurrent;
  }

  /**
   * Verifica si la cola tiene espacio
   */
  hasQueueSpace(): boolean {
    return this.queue.length < this.options.maxQueue;
  }

  /**
   * Resetea las métricas
   */
  reset(): void {
    this.totalExecuted = 0;
    this.totalRejected = 0;
    this.totalTimedOut = 0;
  }
}

/**
 * Error cuando el bulkhead rechaza una solicitud
 */
export class BulkheadRejectError extends Error {
  constructor(
    public readonly bulkheadName: string,
    public readonly reason: string,
    public readonly metrics: BulkheadMetrics,
  ) {
    super(
      `Bulkhead "${bulkheadName}" rejected request: ${reason}. ` +
        `Active: ${metrics.activeCount}/${metrics.maxConcurrent}, ` +
        `Queued: ${metrics.queuedCount}/${metrics.maxQueue}`,
    );
    this.name = 'BulkheadRejectError';
  }
}

/**
 * Error cuando una solicitud expira en la cola
 */
export class BulkheadTimeoutError extends Error {
  constructor(
    public readonly bulkheadName: string,
    public readonly timeoutMs: number,
  ) {
    super(
      `Request timed out in bulkhead "${bulkheadName}" queue after ${timeoutMs}ms`,
    );
    this.name = 'BulkheadTimeoutError';
  }
}

// ============================================
// Registry global de Bulkheads
// ============================================

class BulkheadRegistry {
  private static instance: BulkheadRegistry;
  private bulkheads: Map<string, Bulkhead> = new Map();

  static getInstance(): BulkheadRegistry {
    if (!BulkheadRegistry.instance) {
      BulkheadRegistry.instance = new BulkheadRegistry();
    }
    return BulkheadRegistry.instance;
  }

  register(name: string, bulkhead: Bulkhead): void {
    this.bulkheads.set(name, bulkhead);
  }

  get(name: string): Bulkhead | undefined {
    return this.bulkheads.get(name);
  }

  getOrCreate(options: BulkheadOptions): Bulkhead {
    let bulkhead = this.bulkheads.get(options.name);
    if (!bulkhead) {
      bulkhead = new Bulkhead(options);
      this.bulkheads.set(options.name, bulkhead);
    }
    return bulkhead;
  }

  getAllMetrics(): Record<string, BulkheadMetrics> {
    const metrics: Record<string, BulkheadMetrics> = {};
    this.bulkheads.forEach((bulkhead, name) => {
      metrics[name] = bulkhead.getMetrics();
    });
    return metrics;
  }
}

export const bulkheadRegistry = BulkheadRegistry.getInstance();

// ============================================
// Decorador @UseBulkhead
// ============================================

export interface UseBulkheadOptions {
  name: string;
  maxConcurrent?: number;
  maxQueue?: number;
  queueTimeout?: number;
  /** Si es true, falla inmediatamente sin encolar */
  failFast?: boolean;
}

/**
 * Decorador @UseBulkhead
 *
 * Limita la concurrencia de un método.
 *
 * Uso:
 * ```typescript
 * @UseBulkhead({
 *   name: 'pdf-generation',
 *   maxConcurrent: 5,
 *   maxQueue: 10,
 *   queueTimeout: 30000,
 * })
 * async generatePdf(data: PdfData): Promise<Buffer> {
 *   // Solo 5 PDFs se generan simultáneamente
 * }
 * ```
 */
export function UseBulkhead(options: UseBulkheadOptions) {
  const bulkhead = bulkheadRegistry.getOrCreate({
    name: options.name,
    maxConcurrent: options.maxConcurrent ?? 10,
    maxQueue: options.maxQueue ?? 20,
    queueTimeout: options.queueTimeout ?? 30000,
  });

  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const operation = () => originalMethod.apply(this, args);

      if (options.failFast) {
        return bulkhead.tryExecute(operation);
      }

      return bulkhead.execute(operation);
    };

    return descriptor;
  };
}
