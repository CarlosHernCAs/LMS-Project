/**
 * Servicio de Instituciones (Tenants)
 *
 * Gestiona las instituciones educativas del sistema multi-tenant.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionSettingsDto,
  InstitutionResponseDto,
} from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear nueva institución
   */
  async create(createDto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    // Verificar código único
    const codigoExistente = await this.prisma.institution.findUnique({
      where: { code: createDto.code },
    });
    if (codigoExistente) {
      throw new ConflictException('Ya existe una institución con este código modular');
    }

    // Verificar slug único
    const slugExistente = await this.prisma.institution.findUnique({
      where: { slug: createDto.slug },
    });
    if (slugExistente) {
      throw new ConflictException('Ya existe una institución con este slug');
    }

    // Crear institución con configuración por defecto
    const institucion = await this.prisma.institution.create({
      data: {
        ...createDto,
        settings: {
          periodType: 'BIMESTRAL',
          gradeScale: 'literal',
          allowParentAccess: true,
          requireMfa: false,
        },
      },
    });

    this.logger.log(`Institución creada: ${institucion.name} (${institucion.code})`);

    return this.mapToResponse(institucion);
  }

  /**
   * Obtener todas las instituciones
   */
  async findAll(options?: {
    includeInactive?: boolean;
    search?: string;
    type?: string;
  }): Promise<InstitutionResponseDto[]> {
    const where: any = {};

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search } },
      ];
    }

    if (options?.type) {
      where.type = options.type;
    }

    const instituciones = await this.prisma.institution.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return instituciones.map((inst) => this.mapToResponse(inst));
  }

  /**
   * Obtener institución por ID
   */
  async findById(id: string): Promise<InstitutionResponseDto> {
    const institucion = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institucion) {
      throw new NotFoundException('Institución no encontrada');
    }

    return this.mapToResponse(institucion);
  }

  /**
   * Obtener institución por slug (para resolución de tenant)
   */
  async findBySlug(slug: string): Promise<InstitutionResponseDto | null> {
    const institucion = await this.prisma.institution.findUnique({
      where: { slug },
    });

    if (!institucion) {
      return null;
    }

    return this.mapToResponse(institucion);
  }

  /**
   * Obtener institución por código modular
   */
  async findByCode(code: string): Promise<InstitutionResponseDto | null> {
    const institucion = await this.prisma.institution.findUnique({
      where: { code },
    });

    if (!institucion) {
      return null;
    }

    return this.mapToResponse(institucion);
  }

  /**
   * Actualizar institución
   */
  async update(id: string, updateDto: UpdateInstitutionDto): Promise<InstitutionResponseDto> {
    // Verificar que existe
    const existente = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!existente) {
      throw new NotFoundException('Institución no encontrada');
    }

    // Si se cambia el código, verificar que no exista
    if (updateDto.code && updateDto.code !== existente.code) {
      const codigoExistente = await this.prisma.institution.findUnique({
        where: { code: updateDto.code },
      });
      if (codigoExistente) {
        throw new ConflictException('Ya existe una institución con este código');
      }
    }

    // Si se cambia el slug, verificar que no exista
    if (updateDto.slug && updateDto.slug !== existente.slug) {
      const slugExistente = await this.prisma.institution.findUnique({
        where: { slug: updateDto.slug },
      });
      if (slugExistente) {
        throw new ConflictException('Ya existe una institución con este slug');
      }
    }

    const institucion = await this.prisma.institution.update({
      where: { id },
      data: updateDto,
    });

    this.logger.log(`Institución actualizada: ${institucion.name}`);

    return this.mapToResponse(institucion);
  }

  /**
   * Actualizar configuración de institución
   */
  async updateSettings(
    id: string,
    settingsDto: InstitutionSettingsDto,
  ): Promise<InstitutionResponseDto> {
    const existente = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!existente) {
      throw new NotFoundException('Institución no encontrada');
    }

    // Merge con configuración existente
    const currentSettings = (existente.settings as any) || {};
    const newSettings = { ...currentSettings, ...settingsDto };

    const institucion = await this.prisma.institution.update({
      where: { id },
      data: { settings: newSettings },
    });

    this.logger.log(`Configuración actualizada: ${institucion.name}`);

    return this.mapToResponse(institucion);
  }

  /**
   * Activar/Desactivar institución
   */
  async toggleActive(id: string, isActive: boolean): Promise<InstitutionResponseDto> {
    const institucion = await this.prisma.institution.update({
      where: { id },
      data: { isActive },
    });

    this.logger.log(`Institución ${isActive ? 'activada' : 'desactivada'}: ${institucion.name}`);

    return this.mapToResponse(institucion);
  }

  /**
   * Eliminar institución (soft delete - desactivar)
   */
  async remove(id: string): Promise<void> {
    const institucion = await this.prisma.institution.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!institucion) {
      throw new NotFoundException('Institución no encontrada');
    }

    // No permitir eliminar si tiene usuarios
    if (institucion._count.users > 0) {
      throw new BadRequestException(
        `No se puede eliminar la institución porque tiene ${institucion._count.users} usuarios asociados`,
      );
    }

    // Soft delete (desactivar)
    await this.prisma.institution.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Institución eliminada (desactivada): ${institucion.name}`);
  }

  /**
   * Obtener estadísticas de una institución
   */
  async getStats(id: string): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    activeYear: any;
  }> {
    const institucion = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
        users: {
          select: { role: true },
        },
        academicYears: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!institucion) {
      throw new NotFoundException('Institución no encontrada');
    }

    const students = institucion.users.filter((u) => u.role === 'STUDENT').length;
    const teachers = institucion.users.filter((u) => u.role === 'TEACHER').length;

    return {
      totalUsers: institucion._count.users,
      totalStudents: students,
      totalTeachers: teachers,
      activeYear: institucion.academicYears[0] || null,
    };
  }

  /**
   * Mapear entidad a DTO de respuesta
   */
  private mapToResponse(institucion: any): InstitutionResponseDto {
    return {
      id: institucion.id,
      code: institucion.code,
      name: institucion.name,
      slug: institucion.slug,
      type: institucion.type,
      ugel: institucion.ugel,
      dre: institucion.dre,
      address: institucion.address,
      phone: institucion.phone,
      email: institucion.email,
      logo: institucion.logo,
      isActive: institucion.isActive,
      createdAt: institucion.createdAt,
      updatedAt: institucion.updatedAt,
      settings: institucion.settings as InstitutionSettingsDto,
    };
  }
}
