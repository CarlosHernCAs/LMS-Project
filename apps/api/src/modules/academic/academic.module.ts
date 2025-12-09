/**
 * Módulo Académico
 *
 * Gestiona la estructura académica de la institución:
 * - Años académicos
 * - Períodos (bimestres/trimestres)
 * - Grados
 * - Secciones
 * - Matrículas
 */

import { Module } from '@nestjs/common';

// Services
import {
  AcademicYearService,
  AcademicPeriodService,
  GradeService,
  SectionService,
  EnrollmentService,
} from './services';

// Controllers
import {
  AcademicYearController,
  AcademicPeriodController,
  GradeController,
  SectionController,
  EnrollmentController,
} from './controllers';

@Module({
  imports: [],
  controllers: [
    AcademicYearController,
    AcademicPeriodController,
    GradeController,
    SectionController,
    EnrollmentController,
  ],
  providers: [
    AcademicYearService,
    AcademicPeriodService,
    GradeService,
    SectionService,
    EnrollmentService,
  ],
  exports: [
    AcademicYearService,
    AcademicPeriodService,
    GradeService,
    SectionService,
    EnrollmentService,
  ],
})
export class AcademicModule {}
