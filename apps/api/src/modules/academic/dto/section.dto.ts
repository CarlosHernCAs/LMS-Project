/**
 * DTOs para Sección (A, B, C, etc.)
 */

import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear una sección
 */
export class CreateSectionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la sección es requerido' })
  @MinLength(1, { message: 'El nombre debe tener al menos 1 caracter' })
  @MaxLength(20, { message: 'El nombre no puede exceder 20 caracteres' })
  name: string; // Ej: "A", "B", "Amarillo"

  @IsUUID('4', { message: 'El ID del grado debe ser válido' })
  gradeId: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  academicYearId: string;

  @IsInt({ message: 'La capacidad máxima debe ser un entero' })
  @Min(1, { message: 'La capacidad mínima es 1' })
  @Max(100, { message: 'La capacidad máxima es 100' })
  @IsOptional()
  maxCapacity?: number;

  @IsUUID('4', { message: 'El ID del tutor debe ser válido' })
  @IsOptional()
  tutorId?: string; // Profesor tutor de la sección

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para actualizar una sección
 */
export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El nombre debe tener al menos 1 caracter' })
  @MaxLength(20, { message: 'El nombre no puede exceder 20 caracteres' })
  name?: string;

  @IsInt({ message: 'La capacidad máxima debe ser un entero' })
  @Min(1, { message: 'La capacidad mínima es 1' })
  @Max(100, { message: 'La capacidad máxima es 100' })
  @IsOptional()
  maxCapacity?: number;

  @IsUUID('4', { message: 'El ID del tutor debe ser válido' })
  @IsOptional()
  tutorId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO de respuesta para sección
 */
export class SectionResponseDto {
  id: string;
  name: string;
  gradeId: string;
  academicYearId: string;
  maxCapacity: number | null;
  tutorId: string | null;
  isActive: boolean;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones opcionales
  grade?: {
    id: string;
    name: string;
    level: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    enrollments: number;
  };
}

/**
 * DTO para filtrar secciones
 */
export class FilterSectionDto {
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

  @IsString()
  @IsOptional()
  search?: string;
}
