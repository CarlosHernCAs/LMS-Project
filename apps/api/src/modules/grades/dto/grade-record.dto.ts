/**
 * DTOs para Registro de Calificaciones
 *
 * Sistema de evaluación según CNEB Perú:
 * - AD: Logro destacado (18-20)
 * - A: Logro esperado (14-17)
 * - B: En proceso (11-13)
 * - C: En inicio (0-10)
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Niveles de logro según CNEB
 */
export enum AchievementLevel {
  AD = 'AD', // Logro destacado (18-20)
  A = 'A', // Logro esperado (14-17)
  B = 'B', // En proceso (11-13)
  C = 'C', // En inicio (0-10)
}

/**
 * DTO para crear un registro de calificación
 */
export class CreateGradeRecordDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  studentId: string;

  @IsUUID('4', { message: 'El ID de la competencia debe ser válido' })
  competencyId: string;

  @IsUUID('4', { message: 'El ID del período académico debe ser válido' })
  academicPeriodId: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsEnum(AchievementLevel, { message: 'El nivel de logro no es válido' })
  achievementLevel: AchievementLevel;

  @IsNumber({}, { message: 'La calificación numérica debe ser un número' })
  @Min(0, { message: 'La calificación mínima es 0' })
  @Max(20, { message: 'La calificación máxima es 20' })
  @IsOptional()
  numericGrade?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observations?: string;
}

/**
 * DTO para actualizar un registro de calificación
 */
export class UpdateGradeRecordDto {
  @IsEnum(AchievementLevel, { message: 'El nivel de logro no es válido' })
  @IsOptional()
  achievementLevel?: AchievementLevel;

  @IsNumber({}, { message: 'La calificación numérica debe ser un número' })
  @Min(0, { message: 'La calificación mínima es 0' })
  @Max(20, { message: 'La calificación máxima es 20' })
  @IsOptional()
  numericGrade?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observations?: string;
}

/**
 * DTO para registro masivo de calificaciones
 */
export class BulkGradeRecordDto {
  @IsUUID('4', { message: 'El ID de la competencia debe ser válido' })
  competencyId: string;

  @IsUUID('4', { message: 'El ID del período académico debe ser válido' })
  academicPeriodId: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos una calificación' })
  @ValidateNested({ each: true })
  @Type(() => StudentGradeDto)
  grades: StudentGradeDto[];
}

/**
 * DTO auxiliar para calificación individual en bulk
 */
export class StudentGradeDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  studentId: string;

  @IsEnum(AchievementLevel, { message: 'El nivel de logro no es válido' })
  achievementLevel: AchievementLevel;

  @IsNumber({}, { message: 'La calificación numérica debe ser un número' })
  @Min(0, { message: 'La calificación mínima es 0' })
  @Max(20, { message: 'La calificación máxima es 20' })
  @IsOptional()
  numericGrade?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observations?: string;
}

/**
 * DTO de respuesta para registro de calificación
 */
export class GradeRecordResponseDto {
  id: string;
  studentId: string;
  competencyId: string;
  academicPeriodId: string;
  sectionId: string;
  achievementLevel: AchievementLevel;
  numericGrade: number | null;
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
    };
  };
  competency?: {
    id: string;
    name: string;
    code: string;
    curriculumArea: {
      id: string;
      name: string;
    };
  };
  academicPeriod?: {
    id: string;
    name: string;
    orderNumber: number;
  };
}

/**
 * DTO para filtrar registros de calificación
 */
export class FilterGradeRecordDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  @IsOptional()
  studentId?: string;

  @IsUUID('4', { message: 'El ID de la competencia debe ser válido' })
  @IsOptional()
  competencyId?: string;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  @IsOptional()
  curriculumAreaId?: string;

  @IsUUID('4', { message: 'El ID del período académico debe ser válido' })
  @IsOptional()
  academicPeriodId?: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  @IsOptional()
  sectionId?: string;

  @IsEnum(AchievementLevel, { message: 'El nivel de logro no es válido' })
  @IsOptional()
  achievementLevel?: AchievementLevel;
}

/**
 * DTO para reporte de calificaciones de un estudiante
 */
export class StudentReportCardDto {
  studentId: string;
  studentCode: string;
  studentName: string;
  sectionName: string;
  gradeName: string;
  academicYearName: string;
  periodName: string;
  grades: {
    areaName: string;
    areaCode: string;
    competencies: {
      competencyName: string;
      competencyCode: string;
      achievementLevel: AchievementLevel;
      numericGrade: number | null;
      observations: string | null;
    }[];
    finalLevel: AchievementLevel; // Nivel promedio del área
  }[];
}
