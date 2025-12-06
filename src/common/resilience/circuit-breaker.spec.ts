import { CircuitBreaker, CircuitState } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      name: 'test-circuit',
      failureThreshold: 3,
      recoveryTimeout: 1000,
      timeout: 5000,
      successThreshold: 2,
    });
  });

  describe('Estado inicial', () => {
    it('debe iniciar en estado CLOSED', () => {
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.CLOSED);
    });

    it('debe tener contadores en cero', () => {
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failures).toBe(0);
      expect(metrics.totalCalls).toBe(0);
    });
  });

  describe('Operaciones exitosas', () => {
    it('debe ejecutar operación y retornar resultado', async () => {
      const result = await circuitBreaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('debe incrementar contadores de éxito', async () => {
      await circuitBreaker.execute(async () => 'success');
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.totalCalls).toBe(1);
    });

    it('debe mantener circuito CLOSED con éxitos', async () => {
      await circuitBreaker.execute(async () => 'success');
      await circuitBreaker.execute(async () => 'success');
      await circuitBreaker.execute(async () => 'success');

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Manejo de fallos', () => {
    it('debe contar fallos pero mantener circuito CLOSED si no alcanza threshold', async () => {
      // 2 fallos (threshold es 3)
      await expect(
        circuitBreaker.execute(async () => {
          throw new Error('fail');
        }),
      ).rejects.toThrow();

      await expect(
        circuitBreaker.execute(async () => {
          throw new Error('fail');
        }),
      ).rejects.toThrow();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failures).toBe(2);
      expect(metrics.state).toBe(CircuitState.CLOSED);
    });

    it('debe abrir circuito al alcanzar threshold de fallos', async () => {
      // 3 fallos (threshold es 3)
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw new Error('fail');
          }),
        ).rejects.toThrow();
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.OPEN);
    });
  });

  describe('Fallback cuando circuito está OPEN', () => {
    beforeEach(async () => {
      // Abrir el circuito
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw new Error('fail');
          }),
        ).rejects.toThrow();
      }
    });

    it('debe usar fallback cuando circuito está OPEN', async () => {
      const result = await circuitBreaker.execute(
        async () => 'should not execute',
        () => 'fallback value',
      );

      expect(result).toBe('fallback value');
    });

    it('debe lanzar error si no hay fallback y circuito está OPEN', async () => {
      await expect(
        circuitBreaker.execute(async () => 'should not execute'),
      ).rejects.toThrow('Circuit "test-circuit" is OPEN');
    });
  });

  describe('Recuperación (HALF_OPEN)', () => {
    beforeEach(async () => {
      // Abrir el circuito
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw new Error('fail');
          }),
        ).rejects.toThrow();
      }
    });

    it('debe pasar a HALF_OPEN después del timeout de recuperación', async () => {
      // Esperar el timeout de recuperación
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // La siguiente llamada debe intentar ejecutar (HALF_OPEN)
      await circuitBreaker.execute(async () => 'recovered');

      const metrics = circuitBreaker.getMetrics();
      // Después de 1 éxito en HALF_OPEN, aún necesita 1 más
      expect(metrics.state).toBe(CircuitState.HALF_OPEN);
    });

    it('debe cerrar circuito después de suficientes éxitos en HALF_OPEN', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 2 éxitos (successThreshold es 2)
      await circuitBreaker.execute(async () => 'success1');
      await circuitBreaker.execute(async () => 'success2');

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.CLOSED);
    });

    it('debe volver a OPEN si falla en HALF_OPEN', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));

      await expect(
        circuitBreaker.execute(async () => {
          throw new Error('still failing');
        }),
      ).rejects.toThrow();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.OPEN);
    });
  });

  describe('Timeout de operaciones', () => {
    it('debe fallar si la operación tarda más del timeout', async () => {
      const slowCircuit = new CircuitBreaker({
        name: 'slow-circuit',
        failureThreshold: 3,
        recoveryTimeout: 1000,
        timeout: 100, // 100ms timeout
        successThreshold: 2,
      });

      await expect(
        slowCircuit.execute(async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return 'too slow';
        }),
      ).rejects.toThrow('timed out');
    });
  });

  describe('Reset del circuito', () => {
    it('debe resetear todos los contadores y estado', async () => {
      // Generar algunos fallos
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw new Error('fail');
          }),
        ).rejects.toThrow();
      }

      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Reset
      circuitBreaker.reset();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.CLOSED);
      expect(metrics.failures).toBe(0);
      expect(metrics.totalCalls).toBe(0);
    });
  });
});

/**
 * DEMOSTRACIÓN: Cómo el Circuit Breaker protege el sistema
 *
 * Escenario: El módulo de Reportes falla
 *
 * Sin Circuit Breaker:
 * 1. Usuario pide reporte
 * 2. Servidor intenta generar reporte
 * 3. Error: conexión a BD de reportes fallida
 * 4. Error no manejado
 * 5. Posible crash o respuesta 500
 * 6. Si hay retry automático, satura más el sistema
 *
 * Con Circuit Breaker:
 * 1. Usuario pide reporte
 * 2. Circuit Breaker verifica estado (CLOSED = intentar)
 * 3. Error: conexión fallida
 * 4. Circuit Breaker registra fallo (1/3)
 * 5. Usuario recibe: "Error temporal, intente más tarde"
 * 6. Más fallos → Circuit Breaker se abre
 * 7. Nuevas solicitudes reciben fallback inmediatamente
 * 8. El resto del sistema sigue funcionando
 * 9. Después de 30s, Circuit Breaker intenta recuperar
 *
 * RESULTADO: El módulo de calificaciones, asistencia, auth
 * siguen funcionando perfectamente.
 */
