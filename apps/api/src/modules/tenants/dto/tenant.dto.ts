/**
 * DTOs para Gestión de Instituciones (Tenants)
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { InstitutionType, PeriodType } from '@prisma/client';

/**
 * DTO para crear una institución
 */
export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Código modular MINEDU (único)',
    example: '0123456',
  })
  @IsString()
  @Matches(/^\d{7}$/, { message: 'El código modular debe tener 7 dígitos' })
  code: string;

  @ApiProperty({
    description: 'Nombre de la institución',
    example: 'I.E. San Martín de Porres',
  })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Slug para subdomain (único, sin espacios)',
    example: 'san-martin-porres',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  @MinLength(3)
  @MaxLength(50)
  slug: string;

  @ApiProperty({
    description: 'Tipo de institución',
    enum: InstitutionType,
    example: 'SECUNDARIA',
  })
  @IsEnum(InstitutionType, { message: 'Tipo de institución inválido' })
  type: InstitutionType;

  @ApiPropertyOptional({
    description: 'UGEL a la que pertenece',
    example: 'UGEL 01 San Juan de Miraflores',
  })
  @IsOptional()
  @IsString()
  ugel?: string;

  @ApiPropertyOptional({
    description: 'DRE a la que pertenece',
    example: 'DRE Lima Metropolitana',
  })
  @IsOptional()
  @IsString()
  dre?: string;

  @ApiPropertyOptional({
    description: 'Dirección de la institución',
    example: 'Av. Los Héroes 123, San Juan de Miraflores',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '01-2345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email institucional',
    example: 'contacto@sanmartin.edu.pe',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;
}

/**
 * DTO para actualizar una institución
 */
export class UpdateInstitutionDto extends PartialType(CreateInstitutionDto) {
  @ApiPropertyOptional({
    description: 'URL del logo',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO para configuración de la institución
 */
export class InstitutionSettingsDto {
  @ApiPropertyOptional({
    description: 'Tipo de período académico',
    enum: PeriodType,
    default: 'BIMESTRAL',
  })
  @IsOptional()
  @IsEnum(PeriodType)
  periodType?: PeriodType;

  @ApiPropertyOptional({
    description: 'Escala de calificación: literal (AD,A,B,C), numeric (0-20), both',
    enum: ['literal', 'numeric', 'both'],
    default: 'literal',
  })
  @IsOptional()
  @IsString()
  gradeScale?: 'literal' | 'numeric' | 'both';

  @ApiPropertyOptional({
    description: 'Permitir acceso a padres',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowParentAccess?: boolean;

  @ApiPropertyOptional({
    description: 'Requerir autenticación de dos factores',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requireMfa?: boolean;

  @ApiPropertyOptional({
    description: 'Color primario del tema (hex)',
    example: '#1E40AF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color debe ser formato hex (#RRGGBB)' })
  primaryColor?: string;
}

/**
 * Respuesta de institución
 */
export class InstitutionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty({ enum: InstitutionType }) type: InstitutionType;
  @ApiProperty({ required: false }) ugel?: string;
  @ApiProperty({ required: false }) dre?: string;
  @ApiProperty({ required: false }) address?: string;
  @ApiProperty({ required: false }) phone?: string;
  @ApiProperty({ required: false }) email?: string;
  @ApiProperty({ required: false }) logo?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ required: false }) settings?: InstitutionSettingsDto;
}
