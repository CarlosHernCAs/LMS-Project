/**
 * Servicio de Áreas Curriculares
 *
 * Gestiona las áreas del currículo según CNEB.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateCurriculumAreaDto,
  UpdateCurriculumAreaDto,
  FilterCurriculumAreaDto,
  CurriculumAreaResponseDto,
} from '../dto';

@Injectable()
export class CurriculumAreaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un área curricular
   */
  async create(
    institutionId: string,
    dto: CreateCurriculumAreaDto,
  ): Promise<CurriculumAreaResponseDto> {
    // Verificar nombre o código único
    const existing = await this.prisma.curriculumArea.findFirst({
      where: {
        institutionId,
        OR: [
          { name: dto.name },
          ...(dto.code ? [{ code: dto.code }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un área curricular con el mismo nombre o código',
      );
    }

    // Obtener el siguiente número de orden si no se proporciona
    let orderNumber = dto.orderNumber;
    if (!orderNumber) {
      const lastArea = await this.prisma.curriculumArea.findFirst({
        where: { institutionId },
        orderBy: { orderNumber: 'desc' },
      });
      orderNumber = (lastArea?.orderNumber || 0) + 1;
    }

    const area = await this.prisma.curriculumArea.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        orderNumber,
        isActive: dto.isActive ?? true,
        institutionId,
      },
    });

    return area as CurriculumAreaResponseDto;
  }

  /**
   * Obtener todas las áreas curriculares
   */
  async findAll(
    institutionId: string,
    filter: FilterCurriculumAreaDto,
  ): Promise<CurriculumAreaResponseDto[]> {
    const where: any = { institutionId };

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const areas = await this.prisma.curriculumArea.findMany({
      where,
      orderBy: { orderNumber: 'asc' },
      include: {
        _count: {
          select: {
            competencies: true,
            courseAssignments: true,
          },
        },
      },
    });

    return areas as unknown as CurriculumAreaResponseDto[];
  }

  /**
   * Obtener un área curricular por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<CurriculumAreaResponseDto> {
    const area = await this.prisma.curriculumArea.findFirst({
      where: { id, institutionId },
      include: {
        competencies: {
          where: { isActive: true },
          orderBy: { orderNumber: 'asc' },
        },
        _count: {
          select: {
            competencies: true,
            courseAssignments: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Área curricular no encontrada');
    }

    return area as unknown as CurriculumAreaResponseDto;
  }

  /**
   * Actualizar un área curricular
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateCurriculumAreaDto,
  ): Promise<CurriculumAreaResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Verificar nombre/código único si se cambia
    if (dto.name || dto.code) {
      const duplicate = await this.prisma.curriculumArea.findFirst({
        where: {
          institutionId,
          id: { not: id },
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.code ? [{ code: dto.code }] : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Ya existe un área curricular con el mismo nombre o código',
        );
      }
    }

    const updated = await this.prisma.curriculumArea.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.orderNumber && { orderNumber: dto.orderNumber }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return updated as CurriculumAreaResponseDto;
  }

  /**
   * Eliminar un área curricular
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);

    // Verificar que no tenga competencias o asignaciones
    const counts = await this.prisma.curriculumArea.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            competencies: true,
            courseAssignments: true,
          },
        },
      },
    });

    if (counts?._count.competencies || counts?._count.courseAssignments) {
      throw new ConflictException(
        'No se puede eliminar un área con competencias o asignaciones asociadas',
      );
    }

    await this.prisma.curriculumArea.delete({ where: { id } });
  }

  /**
   * Crear áreas curriculares predeterminadas según CNEB
   */
  async createDefaults(institutionId: string): Promise<CurriculumAreaResponseDto[]> {
    const existing = await this.prisma.curriculumArea.findFirst({
      where: { institutionId },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existen áreas curriculares para esta institución',
      );
    }

    const defaultAreas = [
      { name: 'Comunicación', code: 'COM', orderNumber: 1 },
      { name: 'Matemática', code: 'MAT', orderNumber: 2 },
      { name: 'Ciencia y Tecnología', code: 'CYT', orderNumber: 3 },
      { name: 'Personal Social', code: 'PS', orderNumber: 4 },
      { name: 'Arte y Cultura', code: 'AYC', orderNumber: 5 },
      { name: 'Educación Física', code: 'EF', orderNumber: 6 },
      { name: 'Educación Religiosa', code: 'ER', orderNumber: 7 },
      { name: 'Inglés', code: 'ING', orderNumber: 8 },
      { name: 'Educación para el Trabajo', code: 'EPT', orderNumber: 9 },
      {
        name: 'Desarrollo Personal, Ciudadanía y Cívica',
        code: 'DPCC',
        orderNumber: 10,
      },
    ];

    await this.prisma.curriculumArea.createMany({
      data: defaultAreas.map((area) => ({
        ...area,
        isActive: true,
        institutionId,
      })),
    });

    return this.findAll(institutionId, {});
  }
}
