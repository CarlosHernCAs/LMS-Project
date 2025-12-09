/**
 * Módulo de Dashboard y Estadísticas
 *
 * Proporciona métricas y análisis para el LMS:
 * - Resumen de la institución
 * - Estadísticas de asistencia
 * - Estadísticas de calificaciones
 * - Estadísticas de matrícula
 * - Dashboard personalizado por rol
 * - Alertas del sistema
 */

import { Module } from '@nestjs/common';

import { DashboardService } from './services';
import { DashboardController } from './controllers';

@Module({
  imports: [],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
