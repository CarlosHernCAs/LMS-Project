/**
 * Módulo de Control de Asistencia
 *
 * Gestiona el registro y seguimiento de asistencia:
 * - Asistencia diaria y por clase
 * - Justificaciones de faltas
 * - Reportes y estadísticas
 * - Alertas de estudiantes en riesgo
 */

import { Module } from '@nestjs/common';

import { AttendanceService } from './services';
import { AttendanceController } from './controllers';

@Module({
  imports: [],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
