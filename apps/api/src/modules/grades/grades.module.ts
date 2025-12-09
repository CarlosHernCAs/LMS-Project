/**
 * Módulo de Calificaciones
 *
 * Gestiona el sistema de calificaciones según CNEB Perú:
 * - Áreas curriculares
 * - Competencias por área
 * - Asignación de cursos a profesores
 * - Registro de calificaciones por competencia
 * - Libretas de notas
 */

import { Module } from '@nestjs/common';

// Services
import {
  CurriculumAreaService,
  CompetencyService,
  CourseAssignmentService,
  GradeRecordService,
} from './services';

// Controllers
import {
  CurriculumAreaController,
  CompetencyController,
  CourseAssignmentController,
  GradeRecordController,
} from './controllers';

@Module({
  imports: [],
  controllers: [
    CurriculumAreaController,
    CompetencyController,
    CourseAssignmentController,
    GradeRecordController,
  ],
  providers: [
    CurriculumAreaService,
    CompetencyService,
    CourseAssignmentService,
    GradeRecordService,
  ],
  exports: [
    CurriculumAreaService,
    CompetencyService,
    CourseAssignmentService,
    GradeRecordService,
  ],
})
export class GradesModule {}
