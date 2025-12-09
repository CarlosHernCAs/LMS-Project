/**
 * DTOs para Control de Asistencia
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
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Estados de asistencia
 */
export enum AttendanceStatus {
  PRESENT = 'PRESENT', // Presente
  ABSENT = 'ABSENT', // Ausente
  LATE = 'LATE', // Tardanza
  JUSTIFIED = 'JUSTIFIED', // Falta justificada
  EARLY_LEAVE = 'EARLY_LEAVE', // Salida anticipada
}

/**
 * Tipo de registro de asistencia
 */
export enum AttendanceType {
  DAILY = 'DAILY', // Asistencia diaria general
  CLASS = 'CLASS', // Asistencia por clase/hora
}

/**
 * DTO para crear un registro de asistencia
 */
export class CreateAttendanceDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  studentId: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsDateString({}, { message: 'La fecha debe ser válida' })
  date: string;

  @IsEnum(AttendanceStatus, { message: 'El estado de asistencia no es válido' })
  status: AttendanceStatus;

  @IsEnum(AttendanceType, { message: 'El tipo de asistencia no es válido' })
  @IsOptional()
  type?: AttendanceType;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  @IsOptional()
  curriculumAreaId?: string; // Solo para asistencia por clase

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observations?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'El motivo de justificación no puede exceder 200 caracteres' })
  justificationReason?: string;
}

/**
 * DTO para actualizar un registro de asistencia
 */
export class UpdateAttendanceDto {
  @IsEnum(AttendanceStatus, { message: 'El estado de asistencia no es válido' })
  @IsOptional()
  status?: AttendanceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observations?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'El motivo de justificación no puede exceder 200 caracteres' })
  justificationReason?: string;
}

/**
 * DTO para registro masivo de asistencia
 */
export class BulkAttendanceDto {
  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  sectionId: string;

  @IsDateString({}, { message: 'La fecha debe ser válida' })
  date: string;

  @IsEnum(AttendanceType, { message: 'El tipo de asistencia no es válido' })
  @IsOptional()
  type?: AttendanceType;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  @IsOptional()
  curriculumAreaId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un registro' })
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  records: StudentAttendanceDto[];
}

/**
 * DTO auxiliar para registro individual en bulk
 */
export class StudentAttendanceDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  studentId: string;

  @IsEnum(AttendanceStatus, { message: 'El estado de asistencia no es válido' })
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observations?: string;
}

/**
 * DTO de respuesta para registro de asistencia
 */
export class AttendanceResponseDto {
  id: string;
  studentId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatus;
  type: AttendanceType;
  curriculumAreaId: string | null;
  observations: string | null;
  justificationReason: string | null;
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
  section?: {
    id: string;
    name: string;
    grade: {
      name: string;
      level: string;
    };
  };
  curriculumArea?: {
    id: string;
    name: string;
    code: string;
  };
}

/**
 * DTO para filtrar registros de asistencia
 */
export class FilterAttendanceDto {
  @IsUUID('4', { message: 'El ID del estudiante debe ser válido' })
  @IsOptional()
  studentId?: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  @IsOptional()
  sectionId?: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  @IsOptional()
  endDate?: string;

  @IsEnum(AttendanceStatus, { message: 'El estado de asistencia no es válido' })
  @IsOptional()
  status?: AttendanceStatus;

  @IsEnum(AttendanceType, { message: 'El tipo de asistencia no es válido' })
  @IsOptional()
  type?: AttendanceType;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  @IsOptional()
  curriculumAreaId?: string;
}

/**
 * DTO para estadísticas de asistencia de un estudiante
 */
export class StudentAttendanceStatsDto {
  studentId: string;
  studentCode: string;
  studentName: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  justified: number;
  attendanceRate: number; // Porcentaje de asistencia
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * DTO para estadísticas de asistencia de una sección
 */
export class SectionAttendanceStatsDto {
  sectionId: string;
  sectionName: string;
  gradeName: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  justified: number;
  attendanceRate: number;
}

/**
 * DTO para reporte de asistencia diaria
 */
export class DailyAttendanceReportDto {
  date: string;
  sectionId: string;
  sectionName: string;
  gradeName: string;
  records: {
    studentId: string;
    studentCode: string;
    studentName: string;
    status: AttendanceStatus;
    observations: string | null;
  }[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    justified: number;
  };
}

/**
 * DTO para justificar una falta
 */
export class JustifyAbsenceDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de justificación es requerido' })
  @MaxLength(200, { message: 'El motivo de justificación no puede exceder 200 caracteres' })
  reason: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observations?: string;
}
