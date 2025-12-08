import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Módulo de Reportes
 *
 * Este módulo es independiente y puede fallar sin afectar al resto del sistema.
 * Implementa patrones de resiliencia:
 * - Circuit Breaker: Evita cascada de fallos
 * - Retry: Reintenta operaciones transitorias
 * - Timeout: Evita bloqueos indefinidos
 * - Graceful Degradation: Retorna fallbacks útiles
 */
@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
