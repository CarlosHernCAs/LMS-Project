import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfig } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration
  const configService = app.get(ConfigService);
  const apiConfig = configService.get<AppConfig['api']>('api');
  const nodeEnv = configService.get<string>('nodeEnv');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: apiConfig?.corsOrigin || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
  });

  // Global prefix
  const prefix = apiConfig?.prefix || 'api/v1';
  app.setGlobalPrefix(prefix);

  // API Versioning (optional)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger (only in development)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LMS Perú API')
      .setDescription(
        `
API REST para la plataforma LMS de colegios del Perú.

## Autenticación
La mayoría de endpoints requieren autenticación JWT.
Incluir el token en el header: \`Authorization: Bearer <token>\`

## Multi-tenancy
Los endpoints filtran datos por institución automáticamente.
Incluir el header \`X-Tenant-Id\` o usar subdominio.

## Códigos de respuesta
- 200: Éxito
- 201: Creado
- 400: Error de validación
- 401: No autenticado
- 403: No autorizado
- 404: No encontrado
- 500: Error interno
        `,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-Id', in: 'header' }, 'tenant-id')
      .addTag('auth', 'Autenticación y sesiones')
      .addTag('users', 'Gestión de usuarios')
      .addTag('institutions', 'Instituciones educativas')
      .addTag('academic', 'Gestión académica')
      .addTag('grades', 'Calificaciones')
      .addTag('attendance', 'Asistencia')
      .addTag('reports', 'Reportes')
      .addTag('health', 'Estado del sistema')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Start server
  const port = apiConfig?.port || 3001;
  await app.listen(port);

  // Log startup info
  logger.log(`🚀 LMS API running on http://localhost:${port}/${prefix}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  logger.log(`📊 Health check: http://localhost:${port}/${prefix}/health`);
  logger.log(`🔧 Environment: ${nodeEnv}`);
}

bootstrap();
