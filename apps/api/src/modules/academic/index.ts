// Módulo
export { AcademicModule } from './academic.module';

// Services
export {
  AcademicYearService,
  AcademicPeriodService,
  GradeService,
  SectionService,
  EnrollmentService,
} from './services';

// Controllers
export {
  AcademicYearController,
  AcademicPeriodController,
  GradeController,
  SectionController,
  EnrollmentController,
} from './controllers';

// DTOs
export {
  // Academic Year
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearResponseDto,
  FilterAcademicYearDto,
  // Academic Period
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  AcademicPeriodResponseDto,
  FilterAcademicPeriodDto,
  // Grade
  CreateGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
  FilterGradeDto,
  EducationLevel,
  // Section
  CreateSectionDto,
  UpdateSectionDto,
  SectionResponseDto,
  FilterSectionDto,
  // Enrollment
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  BulkEnrollmentDto,
  TransferEnrollmentDto,
  EnrollmentResponseDto,
  FilterEnrollmentDto,
  EnrollmentStatus,
} from './dto';
