/**
 * DTOs para Competencias (según CNEB Perú)
 *
 * Cada área tiene competencias que se evalúan.
 * Ejemplo para Matemática:
 * - Resuelve problemas de cantidad
 * - Resuelve problemas de regularidad, equivalencia y cambio
 * - Resuelve problemas de forma, movimiento y localización
 * - Resuelve problemas de gestión de datos e incertidumbre
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
 * DTO para crear una competencia
 */
export class CreateCompetencyDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la competencia es requerido' })
  @MinLength(5, { message: 'El nombre debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'El código no puede exceder 20 caracteres' })
  code?: string; // Ej: "MAT-C1", "COM-C2"

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  curriculumAreaId: string;

  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(1, { message: 'El orden mínimo es 1' })
  @Max(20, { message: 'El orden máximo es 20' })
  @IsOptional()
  orderNumber?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para actualizar una competencia
 */
export class UpdateCompetencyDto {
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'El nombre debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'El código no puede exceder 20 caracteres' })
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(1, { message: 'El orden mínimo es 1' })
  @Max(20, { message: 'El orden máximo es 20' })
  @IsOptional()
  orderNumber?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO de respuesta para competencia
 */
export class CompetencyResponseDto {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  curriculumAreaId: string;
  orderNumber: number;
  isActive: boolean;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones opcionales
  curriculumArea?: {
    id: string;
    name: string;
    code: string;
  };
}

/**
 * DTO para filtrar competencias
 */
export class FilterCompetencyDto {
  @IsUUID('4', { message: 'El ID del área curricular debe ser válido' })
  @IsOptional()
  curriculumAreaId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
