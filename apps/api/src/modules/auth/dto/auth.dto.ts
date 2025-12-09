/**
 * DTOs de Autenticación
 *
 * Objetos de transferencia de datos para el módulo de autenticación.
 * Incluye validaciones con class-validator.
 */

import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para iniciar sesión
 */
export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'docente@colegio.edu.pe',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiContraseña123!',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'ID de la institución (opcional si se usa subdominio)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de institución debe ser un UUID válido' })
  institutionId?: string;
}

/**
 * DTO para registrar un nuevo usuario
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Correo electrónico',
    example: 'nuevo.usuario@colegio.edu.pe',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres, debe incluir mayúscula, minúscula y número)',
    example: 'MiContraseña123!',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Juan Carlos',
  })
  @IsString({ message: 'Los nombres deben ser texto' })
  @MinLength(2, { message: 'Los nombres deben tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Los nombres no pueden exceder 100 caracteres' })
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'García López',
  })
  @IsString({ message: 'Los apellidos deben ser texto' })
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Los apellidos no pueden exceder 100 caracteres' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'DNI del usuario (8 dígitos)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos' })
  dni?: string;

  @ApiProperty({
    description: 'ID de la institución',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID de institución debe ser un UUID válido' })
  institutionId: string;
}

/**
 * DTO para refrescar el token de acceso
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de refresco',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El token de refresco es requerido' })
  refreshToken: string;
}

/**
 * DTO para solicitar recuperación de contraseña
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electrónico registrado',
    example: 'usuario@colegio.edu.pe',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiPropertyOptional({
    description: 'ID de la institución',
  })
  @IsOptional()
  @IsUUID('4')
  institutionId?: string;
}

/**
 * DTO para restablecer la contraseña
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de restablecimiento recibido por email',
  })
  @IsString({ message: 'El token es requerido' })
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;
}

/**
 * DTO para cambiar la contraseña (usuario autenticado)
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
  })
  @IsString({ message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;
}
