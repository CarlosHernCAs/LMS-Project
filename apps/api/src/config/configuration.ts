/**
 * Application Configuration
 *
 * Centralized configuration management using @nestjs/config
 * All environment variables are validated and typed
 */

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface ApiConfig {
  port: number;
  prefix: string;
  corsOrigin: string;
}

export interface AppConfig {
  nodeEnv: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  api: ApiConfig;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lms_peru',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  api: {
    port: parseInt(process.env.API_PORT || '3001', 10),
    prefix: process.env.API_PREFIX || 'api/v1',
    corsOrigin: process.env.API_CORS_ORIGIN || 'http://localhost:3000',
  },
});
