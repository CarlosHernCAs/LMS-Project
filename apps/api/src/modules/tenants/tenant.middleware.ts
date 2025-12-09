/**
 * Middleware de Resolución de Tenant
 *
 * Identifica la institución del request mediante:
 * 1. Header X-Tenant-Id
 * 2. Subdomain (ej: colegio-abc.lmsperu.com)
 * 3. Query param ?tenantId=xxx (solo desarrollo)
 *
 * Adjunta el tenant al request para uso posterior.
 */

import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { TenantsService } from './tenants.service';

// Extender el tipo Request para incluir tenant
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: {
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        settings: any;
      };
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  // Rutas que no requieren tenant
  private readonly rutasExcluidas = [
    '/api/v1/health',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/institutions', // Lista pública de instituciones
    '/docs',
  ];

  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Saltar rutas excluidas
    if (this.esRutaExcluida(req.path)) {
      return next();
    }

    // Intentar obtener tenant ID de diferentes fuentes
    let tenantId: string | undefined;

    // 1. Header X-Tenant-Id
    tenantId = req.headers['x-tenant-id'] as string;

    // 2. Subdomain
    if (!tenantId) {
      const slug = this.extraerSubdomain(req);
      if (slug) {
        const tenant = await this.tenantsService.findBySlug(slug);
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    }

    // 3. Query param (solo en desarrollo)
    if (!tenantId && process.env.NODE_ENV === 'development') {
      tenantId = req.query.tenantId as string;
    }

    // Si no se encontró tenant, continuar sin él
    // (algunas rutas pueden no requerirlo)
    if (!tenantId) {
      return next();
    }

    // Validar que el tenant existe y está activo
    try {
      const tenant = await this.tenantsService.findById(tenantId);

      if (!tenant.isActive) {
        throw new BadRequestException('La institución no está activa');
      }

      // Adjuntar al request
      req.tenantId = tenant.id;
      req.tenant = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isActive: tenant.isActive,
        settings: tenant.settings,
      };
    } catch (error) {
      // Si el tenant no existe, continuar (el guard de auth validará después)
    }

    next();
  }

  /**
   * Verifica si la ruta está excluida del middleware
   */
  private esRutaExcluida(path: string): boolean {
    return this.rutasExcluidas.some(
      (ruta) => path === ruta || path.startsWith(ruta + '/'),
    );
  }

  /**
   * Extrae el subdomain del host
   * Ejemplo: "colegio-abc.lmsperu.com" -> "colegio-abc"
   */
  private extraerSubdomain(req: Request): string | null {
    const host = req.headers.host || '';
    const parts = host.split('.');

    // Necesitamos al menos 3 partes: subdomain.domain.tld
    if (parts.length >= 3) {
      const subdomain = parts[0];

      // Ignorar subdomains comunes
      if (['www', 'api', 'app', 'admin'].includes(subdomain)) {
        return null;
      }

      return subdomain;
    }

    return null;
  }
}
