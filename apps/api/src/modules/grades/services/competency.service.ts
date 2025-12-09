/**
 * Servicio de Competencias
 *
 * Gestiona las competencias de cada área curricular según CNEB.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateCompetencyDto,
  UpdateCompetencyDto,
  FilterCompetencyDto,
  CompetencyResponseDto,
} from '../dto';

@Injectable()
export class CompetencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una competencia
   */
  async create(
    institutionId: string,
    dto: CreateCompetencyDto,
  ): Promise<CompetencyResponseDto> {
    // Verificar que el área curricular existe
    const area = await this.prisma.curriculumArea.findFirst({
      where: { id: dto.curriculumAreaId, institutionId },
    });

    if (!area) {
      throw new NotFoundException('Área curricular no encontrada');
    }

    // Verificar nombre o código único dentro del área
    const existing = await this.prisma.competency.findFirst({
      where: {
        curriculumAreaId: dto.curriculumAreaId,
        OR: [
          { name: dto.name },
          ...(dto.code ? [{ code: dto.code }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una competencia con el mismo nombre o código en esta área',
      );
    }

    // Obtener el siguiente número de orden si no se proporciona
    let orderNumber = dto.orderNumber;
    if (!orderNumber) {
      const lastCompetency = await this.prisma.competency.findFirst({
        where: { curriculumAreaId: dto.curriculumAreaId },
        orderBy: { orderNumber: 'desc' },
      });
      orderNumber = (lastCompetency?.orderNumber || 0) + 1;
    }

    const competency = await this.prisma.competency.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        curriculumAreaId: dto.curriculumAreaId,
        orderNumber,
        isActive: dto.isActive ?? true,
        institutionId,
      },
      include: {
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return competency as unknown as CompetencyResponseDto;
  }

  /**
   * Obtener todas las competencias
   */
  async findAll(
    institutionId: string,
    filter: FilterCompetencyDto,
  ): Promise<CompetencyResponseDto[]> {
    const where: any = { institutionId };

    if (filter.curriculumAreaId) {
      where.curriculumAreaId = filter.curriculumAreaId;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const competencies = await this.prisma.competency.findMany({
      where,
      orderBy: [
        { curriculumArea: { orderNumber: 'asc' } },
        { orderNumber: 'asc' },
      ],
      include: {
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return competencies as unknown as CompetencyResponseDto[];
  }

  /**
   * Obtener una competencia por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<CompetencyResponseDto> {
    const competency = await this.prisma.competency.findFirst({
      where: { id, institutionId },
      include: {
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!competency) {
      throw new NotFoundException('Competencia no encontrada');
    }

    return competency as unknown as CompetencyResponseDto;
  }

  /**
   * Obtener competencias por área curricular
   */
  async findByArea(
    institutionId: string,
    curriculumAreaId: string,
  ): Promise<CompetencyResponseDto[]> {
    // Verificar que el área existe
    const area = await this.prisma.curriculumArea.findFirst({
      where: { id: curriculumAreaId, institutionId },
    });

    if (!area) {
      throw new NotFoundException('Área curricular no encontrada');
    }

    const competencies = await this.prisma.competency.findMany({
      where: {
        curriculumAreaId,
        isActive: true,
      },
      orderBy: { orderNumber: 'asc' },
      include: {
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return competencies as unknown as CompetencyResponseDto[];
  }

  /**
   * Actualizar una competencia
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateCompetencyDto,
  ): Promise<CompetencyResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Verificar nombre/código único si se cambia
    if (dto.name || dto.code) {
      const duplicate = await this.prisma.competency.findFirst({
        where: {
          curriculumAreaId: existing.curriculumAreaId,
          id: { not: id },
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.code ? [{ code: dto.code }] : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Ya existe una competencia con el mismo nombre o código en esta área',
        );
      }
    }

    const updated = await this.prisma.competency.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.orderNumber && { orderNumber: dto.orderNumber }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return updated as unknown as CompetencyResponseDto;
  }

  /**
   * Eliminar una competencia
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);

    // Verificar que no tenga calificaciones registradas
    const hasGrades = await this.prisma.gradeRecord.findFirst({
      where: { competencyId: id },
    });

    if (hasGrades) {
      throw new ConflictException(
        'No se puede eliminar una competencia con calificaciones registradas',
      );
    }

    await this.prisma.competency.delete({ where: { id } });
  }

  /**
   * Crear competencias predeterminadas para Matemática según CNEB
   */
  async createDefaultsForMath(
    institutionId: string,
    curriculumAreaId: string,
  ): Promise<CompetencyResponseDto[]> {
    const area = await this.prisma.curriculumArea.findFirst({
      where: { id: curriculumAreaId, institutionId, code: 'MAT' },
    });

    if (!area) {
      throw new NotFoundException('Área de Matemática no encontrada');
    }

    const existing = await this.prisma.competency.findFirst({
      where: { curriculumAreaId },
    });

    if (existing) {
      throw new ConflictException('Ya existen competencias para esta área');
    }

    const defaultCompetencies = [
      {
        name: 'Resuelve problemas de cantidad',
        code: 'MAT-C1',
        orderNumber: 1,
      },
      {
        name: 'Resuelve problemas de regularidad, equivalencia y cambio',
        code: 'MAT-C2',
        orderNumber: 2,
      },
      {
        name: 'Resuelve problemas de forma, movimiento y localización',
        code: 'MAT-C3',
        orderNumber: 3,
      },
      {
        name: 'Resuelve problemas de gestión de datos e incertidumbre',
        code: 'MAT-C4',
        orderNumber: 4,
      },
    ];

    await this.prisma.competency.createMany({
      data: defaultCompetencies.map((c) => ({
        ...c,
        curriculumAreaId,
        isActive: true,
        institutionId,
      })),
    });

    return this.findByArea(institutionId, curriculumAreaId);
  }

  /**
   * Crear competencias predeterminadas para Comunicación según CNEB
   */
  async createDefaultsForCommunication(
    institutionId: string,
    curriculumAreaId: string,
  ): Promise<CompetencyResponseDto[]> {
    const area = await this.prisma.curriculumArea.findFirst({
      where: { id: curriculumAreaId, institutionId, code: 'COM' },
    });

    if (!area) {
      throw new NotFoundException('Área de Comunicación no encontrada');
    }

    const existing = await this.prisma.competency.findFirst({
      where: { curriculumAreaId },
    });

    if (existing) {
      throw new ConflictException('Ya existen competencias para esta área');
    }

    const defaultCompetencies = [
      {
        name: 'Se comunica oralmente en su lengua materna',
        code: 'COM-C1',
        orderNumber: 1,
      },
      {
        name: 'Lee diversos tipos de textos escritos en su lengua materna',
        code: 'COM-C2',
        orderNumber: 2,
      },
      {
        name: 'Escribe diversos tipos de textos en su lengua materna',
        code: 'COM-C3',
        orderNumber: 3,
      },
    ];

    await this.prisma.competency.createMany({
      data: defaultCompetencies.map((c) => ({
        ...c,
        curriculumAreaId,
        isActive: true,
        institutionId,
      })),
    });

    return this.findByArea(institutionId, curriculumAreaId);
  }
}
