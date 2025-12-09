/**
 * Servicio de Períodos Académicos
 *
 * Gestiona los bimestres/trimestres dentro de un año académico.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  FilterAcademicPeriodDto,
  AcademicPeriodResponseDto,
} from '../dto';

@Injectable()
export class AcademicPeriodService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo período académico
   */
  async create(
    institutionId: string,
    dto: CreateAcademicPeriodDto,
  ): Promise<AcademicPeriodResponseDto> {
    // Verificar que el año académico existe y pertenece a la institución
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, institutionId },
    });

    if (!academicYear) {
      throw new NotFoundException('Año académico no encontrado');
    }

    // Validar fechas
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Validar que las fechas estén dentro del año académico
    if (startDate < academicYear.startDate || endDate > academicYear.endDate) {
      throw new BadRequestException(
        'Las fechas del período deben estar dentro del rango del año académico',
      );
    }

    // Verificar que no exista un período con el mismo número de orden
    const existingPeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        academicYearId: dto.academicYearId,
        orderNumber: dto.orderNumber,
      },
    });

    if (existingPeriod) {
      throw new ConflictException(
        `Ya existe un período con el número de orden ${dto.orderNumber}`,
      );
    }

    // Si se marca como activo, desactivar los demás del mismo año
    if (dto.isActive) {
      await this.prisma.academicPeriod.updateMany({
        where: { academicYearId: dto.academicYearId, isActive: true },
        data: { isActive: false },
      });
    }

    const period = await this.prisma.academicPeriod.create({
      data: {
        name: dto.name,
        orderNumber: dto.orderNumber,
        startDate,
        endDate,
        isActive: dto.isActive ?? false,
        academicYearId: dto.academicYearId,
        institutionId,
      },
    });

    return period as AcademicPeriodResponseDto;
  }

  /**
   * Obtener todos los períodos académicos
   */
  async findAll(
    institutionId: string,
    filter: FilterAcademicPeriodDto,
  ): Promise<AcademicPeriodResponseDto[]> {
    const where: any = { institutionId };

    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const periods = await this.prisma.academicPeriod.findMany({
      where,
      orderBy: [{ academicYearId: 'desc' }, { orderNumber: 'asc' }],
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
      },
    });

    return periods as unknown as AcademicPeriodResponseDto[];
  }

  /**
   * Obtener un período por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<AcademicPeriodResponseDto> {
    const period = await this.prisma.academicPeriod.findFirst({
      where: { id, institutionId },
      include: {
        academicYear: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Período académico no encontrado');
    }

    return period as unknown as AcademicPeriodResponseDto;
  }

  /**
   * Obtener el período activo actual
   */
  async findActive(
    institutionId: string,
    academicYearId?: string,
  ): Promise<AcademicPeriodResponseDto | null> {
    const where: any = { institutionId, isActive: true };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    } else {
      // Buscar en el año académico activo
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { institutionId, isActive: true },
      });
      if (activeYear) {
        where.academicYearId = activeYear.id;
      }
    }

    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where,
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
      },
    });

    return activePeriod as unknown as AcademicPeriodResponseDto | null;
  }

  /**
   * Actualizar un período académico
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateAcademicPeriodDto,
  ): Promise<AcademicPeriodResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Obtener el año académico para validar fechas
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: existing.academicYearId },
    });

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

      if (
        academicYear &&
        (startDate < academicYear.startDate || endDate > academicYear.endDate)
      ) {
        throw new BadRequestException(
          'Las fechas del período deben estar dentro del rango del año académico',
        );
      }
    }

    // Verificar número de orden único si se cambia
    if (dto.orderNumber && dto.orderNumber !== existing.orderNumber) {
      const duplicate = await this.prisma.academicPeriod.findFirst({
        where: {
          academicYearId: existing.academicYearId,
          orderNumber: dto.orderNumber,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Ya existe un período con el número de orden ${dto.orderNumber}`,
        );
      }
    }

    // Si se marca como activo, desactivar los demás
    if (dto.isActive === true) {
      await this.prisma.academicPeriod.updateMany({
        where: {
          academicYearId: existing.academicYearId,
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    const updated = await this.prisma.academicPeriod.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.orderNumber && { orderNumber: dto.orderNumber }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return updated as AcademicPeriodResponseDto;
  }

  /**
   * Eliminar un período académico
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);

    // Verificar que no tenga calificaciones asociadas
    const hasGrades = await this.prisma.gradeRecord.findFirst({
      where: { academicPeriodId: id },
    });

    if (hasGrades) {
      throw new ConflictException(
        'No se puede eliminar un período con calificaciones registradas',
      );
    }

    await this.prisma.academicPeriod.delete({ where: { id } });
  }

  /**
   * Crear períodos automáticamente (bimestres o trimestres)
   */
  async createBulk(
    institutionId: string,
    academicYearId: string,
    type: 'BIMESTRE' | 'TRIMESTRE',
  ): Promise<AcademicPeriodResponseDto[]> {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, institutionId },
    });

    if (!academicYear) {
      throw new NotFoundException('Año académico no encontrado');
    }

    // Verificar que no existan períodos
    const existingPeriods = await this.prisma.academicPeriod.findMany({
      where: { academicYearId },
    });

    if (existingPeriods.length > 0) {
      throw new ConflictException(
        'Ya existen períodos para este año académico',
      );
    }

    const numberOfPeriods = type === 'BIMESTRE' ? 4 : 3;
    const totalDays = Math.floor(
      (academicYear.endDate.getTime() - academicYear.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const daysPerPeriod = Math.floor(totalDays / numberOfPeriods);

    const periods: any[] = [];
    let currentStart = new Date(academicYear.startDate);

    for (let i = 1; i <= numberOfPeriods; i++) {
      const endDate = new Date(currentStart);
      endDate.setDate(
        endDate.getDate() + daysPerPeriod - 1,
      );

      // El último período termina exactamente cuando termina el año
      if (i === numberOfPeriods) {
        endDate.setTime(academicYear.endDate.getTime());
      }

      periods.push({
        name: `${type === 'BIMESTRE' ? 'Bimestre' : 'Trimestre'} ${this.toRoman(i)}`,
        orderNumber: i,
        startDate: new Date(currentStart),
        endDate: new Date(endDate),
        isActive: i === 1, // El primer período está activo
        academicYearId,
        institutionId,
      });

      currentStart = new Date(endDate);
      currentStart.setDate(currentStart.getDate() + 1);
    }

    await this.prisma.academicPeriod.createMany({ data: periods });

    return this.findAll(institutionId, { academicYearId });
  }

  /**
   * Convertir número a romano
   */
  private toRoman(num: number): string {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    return romans[num - 1] || num.toString();
  }
}
