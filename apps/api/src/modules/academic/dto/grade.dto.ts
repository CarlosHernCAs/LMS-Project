/**
 * DTOs para Grado Académico
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
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Niveles educativos según el sistema peruano
 */
export enum EducationLevel {
  INICIAL = 'INICIAL', // 3-5 años
  PRIMARIA = 'PRIMARIA', // 1°-6° grado
  SECUNDARIA = 'SECUNDARIA', // 1°-5° año
}

/**
 * DTO para crear un grado
 */
export class CreateGradeDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del grado es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string; // Ej: "Primer Grado", "1° Primaria"

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'El código corto no puede exceder 10 caracteres' })
  shortCode?: string; // Ej: "1P", "2S"

  @IsInt({ message: 'El número de orden debe ser un entero' })
  @Min(1, { message: 'El número de orden mínimo es 1' })
  @Max(20, { message: 'El número de orden máximo es 20' })
  orderNumber: number;

  @IsEnum(EducationLevel, { message: 'El nivel educativo no es válido' })
  level: EducationLevel;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para actualizar un grado
 */
export class UpdateGradeDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'El código corto no puede exceder 10 caracteres' })
  shortCode?: string;

  @IsInt({ message: 'El número de orden debe ser un entero' })
  @Min(1, { message: 'El número de orden mínimo es 1' })
  @Max(20, { message: 'El número de orden máximo es 20' })
  @IsOptional()
  orderNumber?: number;

  @IsEnum(EducationLevel, { message: 'El nivel educativo no es válido' })
  @IsOptional()
  level?: EducationLevel;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO de respuesta para grado
 */
export class GradeResponseDto {
  id: string;
  name: string;
  shortCode: string | null;
  orderNumber: number;
  level: EducationLevel;
  isActive: boolean;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para filtrar grados
 */
export class FilterGradeDto {
  @IsEnum(EducationLevel, { message: 'El nivel educativo no es válido' })
  @IsOptional()
  level?: EducationLevel;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
