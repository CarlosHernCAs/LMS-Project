// Módulo
export { AuthModule } from './auth.module';

// Servicio
export { AuthService } from './auth.service';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';

// Decoradores
export { Public, IS_PUBLIC_KEY, CurrentUser } from './decorators';

// DTOs
export * from './dto/auth.dto';
export * from './dto/auth-response.dto';

// Estrategias
export { JwtStrategy } from './strategies/jwt.strategy';
