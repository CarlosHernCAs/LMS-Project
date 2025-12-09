/**
 * DTOs para Gestión de Usuarios
 */

import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * DTO para crear un usuario
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico',
    example: 'usuario@colegio.edu.pe',
  })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener mayúscula, minúscula y número',
  })
  password: string;

  @ApiProperty({
    description: 'Nombres',
    example: 'Juan Carlos',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellidos',
    example: 'García López',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'DNI (8 dígitos)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  dni?: string;

  @ApiPropertyOptional({
    description: 'Teléfono',
    example: '987654321',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: Role,
    example: 'TEACHER',
  })
  @IsEnum(Role, { message: 'Rol inválido' })
  role: Role;

  @ApiProperty({
    description: 'ID de la institución',
  })
  @IsUUID('4')
  institutionId: string;
}

/**
 * DTO para actualizar un usuario
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'institutionId'] as const),
) {
  @ApiPropertyOptional({
    description: 'URL del avatar',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO para búsqueda/filtro de usuarios
 */
export class FilterUsersDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre o email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por rol', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Incluir usuarios inactivos' })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Límite por página', default: 20 })
  @IsOptional()
  limit?: number;
}

/**
 * DTO para datos de estudiante
 */
export class StudentDataDto {
  @ApiPropertyOptional({ description: 'Fecha de nacimiento' })
  @IsOptional()
  birthDate?: Date;

  @ApiPropertyOptional({ description: 'Género' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Tipo de sangre' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ description: 'Contacto de emergencia' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Teléfono de emergencia' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: 'Notas médicas' })
  @IsOptional()
  @IsString()
  medicalNotes?: string;
}

/**
 * DTO para vincular padre-hijo
 */
export class LinkParentStudentDto {
  @ApiProperty({ description: 'ID del padre/apoderado' })
  @IsUUID('4')
  parentId: string;

  @ApiProperty({ description: 'ID del estudiante' })
  @IsUUID('4')
  studentId: string;

  @ApiProperty({
    description: 'Relación',
    example: 'padre',
  })
  @IsString()
  relationship: string;

  @ApiPropertyOptional({ description: 'Es contacto primario' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/**
 * DTO para importación masiva
 */
export class BulkImportUserDto {
  @ApiProperty({ description: 'Lista de usuarios a importar' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}

/**
 * Respuesta de usuario
 */
export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty({ required: false }) dni?: string;
  @ApiProperty({ required: false }) phone?: string;
  @ApiProperty({ required: false }) avatar?: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() institutionId: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty({ required: false }) lastLoginAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

/**
 * Respuesta paginada
 */
export class PaginatedUsersDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
