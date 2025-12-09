/**
 * DTOs para Período Académico (Bimestre/Trimestre)
 */

import {
  IsString,
  IsNotEmpty,
  IsDateString,
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
 * DTO para crear un período académico
 */
export class CreateAcademicPeriodDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del período es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string; // Ej: "Bimestre I", "Trimestre 1"

  @IsInt({ message: 'El número de orden debe ser un entero' })
  @Min(1, { message: 'El número de orden mínimo es 1' })
  @Max(6, { message: 'El número de orden máximo es 6' })
  orderNumber: number; // 1, 2, 3, 4 para bimestres

  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  startDate: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  endDate: string;

  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  academicYearId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para actualizar un período académico
 */
export class UpdateAcademicPeriodDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name?: string;

  @IsInt({ message: 'El número de orden debe ser un entero' })
  @Min(1, { message: 'El número de orden mínimo es 1' })
  @Max(6, { message: 'El número de orden máximo es 6' })
  @IsOptional()
  orderNumber?: number;

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
 * DTO de respuesta para período académico
 */
export class AcademicPeriodResponseDto {
  id: string;
  name: string;
  orderNumber: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  academicYearId: string;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para filtrar períodos académicos
 */
export class FilterAcademicPeriodDto {
  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  @IsOptional()
  academicYearId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
