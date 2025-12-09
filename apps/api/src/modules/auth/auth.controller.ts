/**
 * Controlador de Autenticación
 *
 * Endpoints para manejo de sesiones y credenciales:
 * - POST /auth/login - Iniciar sesión
 * - POST /auth/register - Registrar usuario
 * - POST /auth/refresh - Refrescar token
 * - POST /auth/logout - Cerrar sesión
 * - POST /auth/forgot-password - Solicitar recuperación
 * - POST /auth/reset-password - Restablecer contraseña
 * - POST /auth/change-password - Cambiar contraseña
 * - GET /auth/me - Obtener usuario actual
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import {
  LoginResponseDto,
  RefreshResponseDto,
  MessageResponseDto,
  AuthenticatedUser,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public, CurrentUser } from './decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Iniciar sesión
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario y retorna tokens de acceso',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Registrar nuevo usuario
   */
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario',
    description: 'Crea una nueva cuenta de usuario',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() registerDto: RegisterDto): Promise<MessageResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Refrescar token de acceso
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token',
    description: 'Obtiene un nuevo token de acceso usando el refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Cerrar sesión
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    type: MessageResponseDto,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body?: { refreshToken?: string },
  ): Promise<MessageResponseDto> {
    return this.authService.logout(userId, body?.refreshToken);
  }

  /**
   * Solicitar recuperación de contraseña
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Olvidé mi contraseña',
    description: 'Envía un email con instrucciones para restablecer la contraseña',
  })
  @ApiResponse({
    status: 200,
    description: 'Instrucciones enviadas (si el email existe)',
    type: MessageResponseDto,
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Restablecer contraseña con token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description: 'Establece una nueva contraseña usando el token de recuperación',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description: 'Permite al usuario cambiar su contraseña actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  /**
   * Obtener usuario actual
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener usuario actual',
    description: 'Retorna la información del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario',
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      data: user,
    };
  }
}
