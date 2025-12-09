/**
 * Servicio de Años Académicos
 *
 * Gestiona los años escolares de una institución.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  FilterAcademicYearDto,
  AcademicYearResponseDto,
} from '../dto';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo año académico
   */
  async create(
    institutionId: string,
    dto: CreateAcademicYearDto,
  ): Promise<AcademicYearResponseDto> {
    // Validar fechas
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Verificar que no exista un año con el mismo nombre
    const existingYear = await this.prisma.academicYear.findFirst({
      where: {
        institutionId,
        name: dto.name,
      },
    });

    if (existingYear) {
      throw new ConflictException(
        `Ya existe un año académico con el nombre "${dto.name}"`,
      );
    }

    // Si se marca como activo, desactivar los demás
    if (dto.isActive) {
      await this.prisma.academicYear.updateMany({
        where: { institutionId, isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await this.prisma.academicYear.create({
      data: {
        name: dto.name,
        startDate,
        endDate,
        isActive: dto.isActive ?? false,
        institutionId,
      },
    });

    return academicYear as AcademicYearResponseDto;
  }

  /**
   * Obtener todos los años académicos de una institución
   */
  async findAll(
    institutionId: string,
    filter: FilterAcademicYearDto,
  ): Promise<AcademicYearResponseDto[]> {
    const where: any = { institutionId };

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const years = await this.prisma.academicYear.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    return years as AcademicYearResponseDto[];
  }

  /**
   * Obtener un año académico por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<AcademicYearResponseDto> {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, institutionId },
      include: {
        periods: {
          orderBy: { orderNumber: 'asc' },
        },
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Año académico no encontrado');
    }

    return academicYear as unknown as AcademicYearResponseDto;
  }

  /**
   * Obtener el año académico activo
   */
  async findActive(institutionId: string): Promise<AcademicYearResponseDto | null> {
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { institutionId, isActive: true },
      include: {
        periods: {
          where: { isActive: true },
          orderBy: { orderNumber: 'asc' },
        },
      },
    });

    return activeYear as AcademicYearResponseDto | null;
  }

  /**
   * Actualizar un año académico
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateAcademicYearDto,
  ): Promise<AcademicYearResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Validar fechas si se proporcionan
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : existing.startDate;
      const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }
    }

    // Verificar nombre único si se cambia
    if (dto.name && dto.name !== existing.name) {
      const duplicateName = await this.prisma.academicYear.findFirst({
        where: {
          institutionId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (duplicateName) {
        throw new ConflictException(
          `Ya existe un año académico con el nombre "${dto.name}"`,
        );
      }
    }

    // Si se marca como activo, desactivar los demás
    if (dto.isActive === true) {
      await this.prisma.academicYear.updateMany({
        where: { institutionId, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await this.prisma.academicYear.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return updated as AcademicYearResponseDto;
  }

  /**
   * Eliminar un año académico
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);

    // Verificar que no tenga secciones o matrículas asociadas
    const counts = await this.prisma.academicYear.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
      },
    });

    if (counts?._count.sections || counts?._count.enrollments) {
      throw new ConflictException(
        'No se puede eliminar un año académico con secciones o matrículas asociadas',
      );
    }

    await this.prisma.academicYear.delete({ where: { id } });
  }

  /**
   * Activar un año académico (desactiva los demás)
   */
  async activate(institutionId: string, id: string): Promise<AcademicYearResponseDto> {
    await this.findOne(institutionId, id);

    // Desactivar todos los años de la institución
    await this.prisma.academicYear.updateMany({
      where: { institutionId },
      data: { isActive: false },
    });

    // Activar el seleccionado
    const activated = await this.prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    });

    return activated as AcademicYearResponseDto;
  }
}
