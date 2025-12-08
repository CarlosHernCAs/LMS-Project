// Circuit Breaker
export { CircuitBreaker, CircuitBreakerOptions, CircuitBreakerMetrics, CircuitState, CircuitBreakerError } from './circuit-breaker';

// Decorators
export {
  UseCircuitBreaker,
  GracefulDegradation,
  Timeout,
  Retry,
  RetryOptions,
  CircuitBreakerDecoratorOptions,
  circuitBreakerRegistry,
} from './circuit-breaker.decorator';

// Bulkhead
export {
  Bulkhead,
  BulkheadOptions,
  BulkheadMetrics,
  BulkheadRejectError,
  BulkheadTimeoutError,
  UseBulkhead,
  UseBulkheadOptions,
  bulkheadRegistry,
} from './bulkhead';

// Module & Service
export { ResilienceModule, ResilienceModuleOptions } from './resilience.module';
export { ResilienceService } from './resilience.service';

// Health
export { CircuitBreakerHealthIndicator } from './circuit-breaker.health';
