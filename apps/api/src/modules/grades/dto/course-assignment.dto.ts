/**
 * DTOs para Asignación de Cursos
 *
 * Relaciona un profesor con un área curricular, sección y año académico.
 */

import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear una asignación de curso
 */
export class CreateCourseAssignmentDto {
  @IsUUID('4', { message: 'El ID del profesor debe ser válido' })
  teacherId: string;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  curriculumAreaId: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  academicYearId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para asignación masiva de cursos
 */
export class BulkCourseAssignmentDto {
  @IsUUID('4', { message: 'El ID del profesor debe ser válido' })
  teacherId: string;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  curriculumAreaId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos una sección' })
  @IsUUID('4', { each: true, message: 'Cada ID de sección debe ser válido' })
  sectionIds: string[];

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  academicYearId: string;
}

/**
 * DTO para actualizar una asignación de curso
 */
export class UpdateCourseAssignmentDto {
  @IsUUID('4', { message: 'El ID del profesor debe ser válido' })
  @IsOptional()
  teacherId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO de respuesta para asignación de curso
 */
export class CourseAssignmentResponseDto {
  id: string;
  teacherId: string;
  curriculumAreaId: string;
  sectionId: string;
  academicYearId: string;
  isActive: boolean;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones opcionales
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  curriculumArea?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
      level: string;
    };
  };
  academicYear?: {
    id: string;
    name: string;
  };
}

/**
 * DTO para filtrar asignaciones de cursos
 */
export class FilterCourseAssignmentDto {
  @IsUUID('4', { message: 'El ID del profesor debe ser válido' })
  @IsOptional()
  teacherId?: string;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  @IsOptional()
  curriculumAreaId?: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  @IsOptional()
  sectionId?: string;

  @IsUUID('4', { message: 'El ID del grado debe ser válido' })
  @IsOptional()
  gradeId?: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  @IsOptional()
  academicYearId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
