/**
 * Servicio de Autenticación
 *
 * Maneja toda la lógica de autenticación:
 * - Login/Logout
 * - Generación y validación de tokens JWT
 * - Refresh tokens
 * - Recuperación de contraseña
 * - Registro de usuarios
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
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
  JwtPayload,
  UserInfoDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Constantes de configuración
  private readonly SALT_ROUNDS = 12;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 24;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Iniciar sesión
   *
   * @param loginDto Datos de login
   * @returns Tokens y datos del usuario
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password, institutionId } = loginDto;

    // Buscar usuario
    const usuario = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(institutionId && { institutionId }),
      },
      include: {
        institution: {
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    // Validar que el usuario existe
    if (!usuario) {
      this.logger.warn(`Intento de login fallido: usuario no encontrado - ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar que la institución está activa
    if (!usuario.institution.isActive) {
      throw new UnauthorizedException('La institución no está activa');
    }

    // Validar que el usuario está activo
    if (!usuario.isActive) {
      throw new UnauthorizedException('El usuario está deshabilitado');
    }

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!contraseñaValida) {
      this.logger.warn(`Intento de login fallido: contraseña incorrecta - ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar tokens
    const tokens = await this.generarTokens(usuario);

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: usuario.id },
      data: { lastLoginAt: new Date() },
    });

    // Guardar refresh token en BD
    await this.guardarRefreshToken(usuario.id, tokens.refreshToken);

    this.logger.log(`Login exitoso: ${email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: this.mapearUsuarioInfo(usuario),
    };
  }

  /**
   * Registrar nuevo usuario
   *
   * @param registerDto Datos de registro
   * @returns Mensaje de confirmación
   */
  async register(registerDto: RegisterDto): Promise<MessageResponseDto> {
    const { email, password, firstName, lastName, dni, institutionId } = registerDto;

    // Verificar que la institución existe y está activa
    const institucion = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institucion || !institucion.isActive) {
      throw new BadRequestException('La institución no existe o no está activa');
    }

    // Verificar que el email no existe en la institución
    const usuarioExistente = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        institutionId,
      },
    });

    if (usuarioExistente) {
      throw new ConflictException('Ya existe un usuario con este correo en la institución');
    }

    // Verificar DNI si se proporciona
    if (dni) {
      const dniExistente = await this.prisma.user.findFirst({
        where: { dni, institutionId },
      });
      if (dniExistente) {
        throw new ConflictException('Ya existe un usuario con este DNI en la institución');
      }
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Crear usuario (por defecto como STUDENT, el admin puede cambiar el rol después)
    await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        dni,
        institutionId,
        role: 'STUDENT', // Rol por defecto
        isActive: true,
        emailVerified: false, // Pendiente verificación
      },
    });

    this.logger.log(`Usuario registrado: ${email} en institución ${institutionId}`);

    // TODO: Enviar email de verificación

    return {
      success: true,
      message:
        'Usuario registrado exitosamente. Por favor revise su correo para verificar su cuenta.',
    };
  }

  /**
   * Refrescar token de acceso
   *
   * @param refreshTokenDto Token de refresco
   * @returns Nuevo token de acceso
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Verificar el refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    // Verificar que es un refresh token
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token inválido');
    }

    // Verificar que el token existe en BD y no está revocado
    const tokenEnBD = await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenEnBD) {
      throw new UnauthorizedException('Token de refresco inválido o revocado');
    }

    // Obtener usuario actualizado
    const usuario = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || !usuario.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o deshabilitado');
    }

    // Generar nuevo access token
    const nuevoAccessToken = this.generarAccessToken(usuario);

    return {
      accessToken: nuevoAccessToken,
      expiresIn: this.obtenerExpiresIn(),
    };
  }

  /**
   * Cerrar sesión (invalidar refresh token)
   *
   * @param userId ID del usuario
   * @param refreshToken Token a invalidar
   */
  async logout(userId: string, refreshToken?: string): Promise<MessageResponseDto> {
    if (refreshToken) {
      // Revocar token específico
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          token: refreshToken,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revocar todos los tokens del usuario
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log(`Logout: usuario ${userId}`);

    return {
      success: true,
      message: 'Sesión cerrada exitosamente',
    };
  }

  /**
   * Solicitar recuperación de contraseña
   *
   * @param forgotPasswordDto Datos para recuperación
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const { email, institutionId } = forgotPasswordDto;

    // Buscar usuario
    const usuario = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(institutionId && { institutionId }),
      },
    });

    // Siempre retornamos el mismo mensaje para evitar enumeración de usuarios
    const mensajeExito = {
      success: true,
      message:
        'Si el correo está registrado, recibirá instrucciones para restablecer su contraseña.',
    };

    if (!usuario) {
      return mensajeExito;
    }

    // Generar token único
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    // Invalidar tokens anteriores
    await this.prisma.passwordReset.updateMany({
      where: {
        userId: usuario.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Guardar nuevo token
    await this.prisma.passwordReset.create({
      data: {
        userId: usuario.id,
        token: resetToken,
        expiresAt,
      },
    });

    // TODO: Enviar email con el token
    this.logger.log(`Token de recuperación generado para: ${email}`);

    return mensajeExito;
  }

  /**
   * Restablecer contraseña con token
   *
   * @param resetPasswordDto Datos para restablecer
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    const { token, newPassword } = resetPasswordDto;

    // Buscar token válido
    const resetToken = await this.prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Actualizar contraseña y marcar token como usado
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidar todos los refresh tokens del usuario
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`Contraseña restablecida: ${resetToken.user.email}`);

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puede iniciar sesión.',
    };
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   *
   * @param userId ID del usuario
   * @param changePasswordDto Datos para cambiar
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Obtener usuario
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const contraseñaValida = await bcrypt.compare(currentPassword, usuario.passwordHash);
    if (!contraseñaValida) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const mismaClave = await bcrypt.compare(newPassword, usuario.passwordHash);
    if (mismaClave) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Actualizar
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Contraseña cambiada: ${usuario.email}`);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }

  /**
   * Validar usuario por ID (usado por JwtStrategy)
   */
  async validateUserById(userId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: {
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    if (!usuario || !usuario.isActive || !usuario.institution.isActive) {
      return null;
    }

    return usuario;
  }

  // ============================================
  // Métodos privados auxiliares
  // ============================================

  /**
   * Genera par de tokens (access + refresh)
   */
  private async generarTokens(usuario: any) {
    const accessToken = this.generarAccessToken(usuario);
    const refreshToken = this.generarRefreshToken(usuario);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.obtenerExpiresIn(),
    };
  }

  /**
   * Genera access token
   */
  private generarAccessToken(usuario: any): string {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      institutionId: usuario.institutionId,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }

  /**
   * Genera refresh token
   */
  private generarRefreshToken(usuario: any): string {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      institutionId: usuario.institutionId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });
  }

  /**
   * Guarda refresh token en BD
   */
  private async guardarRefreshToken(userId: string, token: string): Promise<void> {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = this.calcularFechaExpiracion(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Calcula fecha de expiración desde string (ej: '7d', '24h')
   */
  private calcularFechaExpiracion(duracion: string): Date {
    const fecha = new Date();
    const valor = parseInt(duracion);
    const unidad = duracion.slice(-1);

    switch (unidad) {
      case 'd':
        fecha.setDate(fecha.getDate() + valor);
        break;
      case 'h':
        fecha.setHours(fecha.getHours() + valor);
        break;
      case 'm':
        fecha.setMinutes(fecha.getMinutes() + valor);
        break;
      default:
        fecha.setHours(fecha.getHours() + 24); // Default 24h
    }

    return fecha;
  }

  /**
   * Obtiene expiresIn en segundos
   */
  private obtenerExpiresIn(): number {
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '8h';
    const valor = parseInt(expiresIn);
    const unidad = expiresIn.slice(-1);

    switch (unidad) {
      case 'd':
        return valor * 24 * 60 * 60;
      case 'h':
        return valor * 60 * 60;
      case 'm':
        return valor * 60;
      default:
        return 8 * 60 * 60; // Default 8h
    }
  }

  /**
   * Mapea usuario a DTO de info
   */
  private mapearUsuarioInfo(usuario: any): UserInfoDto {
    return {
      id: usuario.id,
      email: usuario.email,
      firstName: usuario.firstName,
      lastName: usuario.lastName,
      role: usuario.role,
      avatar: usuario.avatar,
      institutionId: usuario.institutionId,
      institutionName: usuario.institution?.name || '',
    };
  }
}
