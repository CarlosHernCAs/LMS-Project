/**
 * Estrategia JWT para Passport
 *
 * Valida los tokens JWT en las solicitudes protegidas.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';
import { JwtPayload, AuthenticatedUser } from '../dto/auth-response.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      // Extraer token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // No ignorar expiración
      ignoreExpiration: false,

      // Secreto para verificar firma
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Valida el payload del token
   *
   * Este método es llamado por Passport después de verificar la firma del token.
   * El valor retornado se adjunta a request.user
   *
   * @param payload Payload decodificado del JWT
   * @returns Usuario autenticado o error
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Verificar que es un access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido');
    }

    // Obtener usuario de la BD para verificar que sigue activo
    const usuario = await this.authService.validateUserById(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o deshabilitado');
    }

    // Retornar datos del usuario para adjuntar a request.user
    return {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      institutionId: usuario.institutionId,
      firstName: usuario.firstName,
      lastName: usuario.lastName,
    };
  }
}
