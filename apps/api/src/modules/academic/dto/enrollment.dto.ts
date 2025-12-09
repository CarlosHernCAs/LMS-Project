/**
 * DTOs para Matrícula de Estudiantes
 */

import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Estado de la matrícula
 */
export enum EnrollmentStatus {
  PENDING = 'PENDING', // Pendiente de confirmación
  ACTIVE = 'ACTIVE', // Matrícula activa
  TRANSFERRED = 'TRANSFERRED', // Trasladado a otra sección/institución
  WITHDRAWN = 'WITHDRAWN', // Retirado
  GRADUATED = 'GRADUATED', // Graduado/Promovido
}

/**
 * DTO para crear una matrícula
 */
export class CreateEnrollmentDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  studentId: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  academicYearId: string;

  @IsDateString({}, { message: 'La fecha de matrícula debe ser válida' })
  @IsOptional()
  enrollmentDate?: string;

  @IsEnum(EnrollmentStatus, { message: 'El estado de matrícula no es válido' })
  @IsOptional()
  status?: EnrollmentStatus;

  @IsString()
  @IsOptional()
  observations?: string;
}

/**
 * DTO para actualizar una matrícula
 */
export class UpdateEnrollmentDto {
  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  @IsOptional()
  sectionId?: string;

  @IsEnum(EnrollmentStatus, { message: 'El estado de matrícula no es válido' })
  @IsOptional()
  status?: EnrollmentStatus;

  @IsString()
  @IsOptional()
  observations?: string;
}

/**
 * DTO para matrícula masiva
 */
export class BulkEnrollmentDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un estudiante' })
  @IsUUID('4', { each: true, message: 'Cada ID de estudiante debe ser válido' })
  studentIds: string[];

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  academicYearId: string;

  @IsDateString({}, { message: 'La fecha de matrícula debe ser válida' })
  @IsOptional()
  enrollmentDate?: string;
}

/**
 * DTO para trasladar estudiante
 */
export class TransferEnrollmentDto {
  @IsUUID('4', { message: 'El ID de la nueva sección debe ser válido' })
  newSectionId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString({}, { message: 'La fecha de traslado debe ser válida' })
  @IsOptional()
  transferDate?: string;
}

/**
 * DTO de respuesta para matrícula
 */
export class EnrollmentResponseDto {
  id: string;
  studentId: string;
  sectionId: string;
  academicYearId: string;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  observations: string | null;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones opcionales
  student?: {
    id: string;
    studentCode: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
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
 * DTO para filtrar matrículas
 */
export class FilterEnrollmentDto {
  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  @IsOptional()
  sectionId?: string;

  @IsUUID('4', { message: 'El ID del grado debe ser válido' })
  @IsOptional()
  gradeId?: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  @IsOptional()
  academicYearId?: string;

  @IsEnum(EnrollmentStatus, { message: 'El estado de matrícula no es válido' })
  @IsOptional()
  status?: EnrollmentStatus;

  @IsString()
  @IsOptional()
  search?: string; // Buscar por nombre o código de estudiante
}
