/**
 * DTOs de Respuesta de Autenticación
 *
 * Estructuras de respuesta para los endpoints de auth.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * Información básica del usuario en las respuestas
 */
export class UserInfoDto {
  @ApiProperty({ description: 'ID único del usuario' })
  id: string;

  @ApiProperty({ description: 'Correo electrónico' })
  email: string;

  @ApiProperty({ description: 'Nombres' })
  firstName: string;

  @ApiProperty({ description: 'Apellidos' })
  lastName: string;

  @ApiProperty({ description: 'Rol del usuario', enum: Role })
  role: Role;

  @ApiProperty({ description: 'URL del avatar', required: false })
  avatar?: string;

  @ApiProperty({ description: 'ID de la institución' })
  institutionId: string;

  @ApiProperty({ description: 'Nombre de la institución' })
  institutionName: string;
}

/**
 * Respuesta exitosa de login
 */
export class LoginResponseDto {
  @ApiProperty({ description: 'Token de acceso JWT' })
  accessToken: string;

  @ApiProperty({ description: 'Token de refresco' })
  refreshToken: string;

  @ApiProperty({ description: 'Tiempo de expiración en segundos' })
  expiresIn: number;

  @ApiProperty({ description: 'Tipo de token' })
  tokenType: string;

  @ApiProperty({ description: 'Información del usuario', type: UserInfoDto })
  user: UserInfoDto;
}

/**
 * Respuesta de refresh token
 */
export class RefreshResponseDto {
  @ApiProperty({ description: 'Nuevo token de acceso' })
  accessToken: string;

  @ApiProperty({ description: 'Tiempo de expiración en segundos' })
  expiresIn: number;
}

/**
 * Respuesta genérica de mensaje
 */
export class MessageResponseDto {
  @ApiProperty({ description: 'Mensaje de respuesta' })
  message: string;

  @ApiProperty({ description: 'Operación exitosa' })
  success: boolean;
}

/**
 * Payload del token JWT
 */
export interface JwtPayload {
  /** ID del usuario */
  sub: string;
  /** Email del usuario */
  email: string;
  /** Rol del usuario */
  role: Role;
  /** ID de la institución */
  institutionId: string;
  /** Tipo de token */
  type: 'access' | 'refresh';
  /** Timestamp de emisión */
  iat?: number;
  /** Timestamp de expiración */
  exp?: number;
}

/**
 * Usuario autenticado en el request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  institutionId: string;
  firstName: string;
  lastName: string;
}
