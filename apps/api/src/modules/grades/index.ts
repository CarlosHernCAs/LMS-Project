// Módulo
export { GradesModule } from './grades.module';

// Services
export {
  CurriculumAreaService,
  CompetencyService,
  CourseAssignmentService,
  GradeRecordService,
} from './services';

// Controllers
export {
  CurriculumAreaController,
  CompetencyController,
  CourseAssignmentController,
  GradeRecordController,
} from './controllers';

// DTOs
export {
  // Curriculum Area
  CreateCurriculumAreaDto,
  UpdateCurriculumAreaDto,
  CurriculumAreaResponseDto,
  FilterCurriculumAreaDto,
  // Competency
  CreateCompetencyDto,
  UpdateCompetencyDto,
  CompetencyResponseDto,
  FilterCompetencyDto,
  // Course Assignment
  CreateCourseAssignmentDto,
  BulkCourseAssignmentDto,
  UpdateCourseAssignmentDto,
  CourseAssignmentResponseDto,
  FilterCourseAssignmentDto,
  // Grade Record
  CreateGradeRecordDto,
  UpdateGradeRecordDto,
  BulkGradeRecordDto,
  StudentGradeDto,
  GradeRecordResponseDto,
  FilterGradeRecordDto,
  StudentReportCardDto,
  AchievementLevel,
} from './dto';
