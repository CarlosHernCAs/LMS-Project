/**
 * DTOs para Año Académico
 */

import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear un año académico
 */
export class CreateAcademicYearDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del año académico es requerido' })
  @MinLength(4, { message: 'El nombre debe tener al menos 4 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string; // Ej: "2024", "2024-2025"

  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  startDate: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para actualizar un año académico
 */
export class UpdateAcademicYearDto {
  @IsString()
  @IsOptional()
  @MinLength(4, { message: 'El nombre debe tener al menos 4 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name?: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO de respuesta para año académico
 */
export class AcademicYearResponseDto {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para filtrar años académicos
 */
export class FilterAcademicYearDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
