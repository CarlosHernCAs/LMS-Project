/**
 * DTOs para Áreas Curriculares (según CNEB Perú)
 *
 * Áreas del Currículo Nacional:
 * - Comunicación
 * - Matemática
 * - Ciencia y Tecnología
 * - Personal Social / DPCC
 * - Arte y Cultura
 * - Educación Física
 * - Educación Religiosa
 * - Inglés
 * - etc.
 */

import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear un área curricular
 */
export class CreateCurriculumAreaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del área es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string; // Ej: "Comunicación", "Matemática"

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'El código no puede exceder 10 caracteres' })
  code?: string; // Ej: "COM", "MAT"

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(1, { message: 'El orden mínimo es 1' })
  @Max(50, { message: 'El orden máximo es 50' })
  @IsOptional()
  orderNumber?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para actualizar un área curricular
 */
export class UpdateCurriculumAreaDto {
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'El código no puede exceder 10 caracteres' })
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(1, { message: 'El orden mínimo es 1' })
  @Max(50, { message: 'El orden máximo es 50' })
  @IsOptional()
  orderNumber?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO de respuesta para área curricular
 */
export class CurriculumAreaResponseDto {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  orderNumber: number;
  isActive: boolean;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones opcionales
  competencies?: any[];
  _count?: {
    competencies: number;
    courseAssignments: number;
  };
}

/**
 * DTO para filtrar áreas curriculares
 */
export class FilterCurriculumAreaDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
