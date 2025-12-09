/**
 * Servicio de Grados Académicos
 *
 * Gestiona los grados (1°, 2°, etc.) de una institución.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateGradeDto,
  UpdateGradeDto,
  FilterGradeDto,
  GradeResponseDto,
  EducationLevel,
} from '../dto';

@Injectable()
export class GradeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo grado
   */
  async create(
    institutionId: string,
    dto: CreateGradeDto,
  ): Promise<GradeResponseDto> {
    // Verificar que no exista un grado con el mismo nombre o código
    const existing = await this.prisma.grade.findFirst({
      where: {
        institutionId,
        OR: [
          { name: dto.name },
          ...(dto.shortCode ? [{ shortCode: dto.shortCode }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un grado con el mismo nombre o código',
      );
    }

    const grade = await this.prisma.grade.create({
      data: {
        name: dto.name,
        shortCode: dto.shortCode,
        orderNumber: dto.orderNumber,
        level: dto.level,
        isActive: dto.isActive ?? true,
        institutionId,
      },
    });

    return grade as unknown as GradeResponseDto;
  }

  /**
   * Obtener todos los grados de una institución
   */
  async findAll(
    institutionId: string,
    filter: FilterGradeDto,
  ): Promise<GradeResponseDto[]> {
    const where: any = { institutionId };

    if (filter.level) {
      where.level = filter.level;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { shortCode: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const grades = await this.prisma.grade.findMany({
      where,
      orderBy: [{ level: 'asc' }, { orderNumber: 'asc' }],
    });

    return grades as unknown as GradeResponseDto[];
  }

  /**
   * Obtener un grado por ID
   */
  async findOne(institutionId: string, id: string): Promise<GradeResponseDto> {
    const grade = await this.prisma.grade.findFirst({
      where: { id, institutionId },
      include: {
        _count: {
          select: { sections: true },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('Grado no encontrado');
    }

    return grade as unknown as GradeResponseDto;
  }

  /**
   * Actualizar un grado
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Verificar nombre/código único si se cambia
    if (dto.name || dto.shortCode) {
      const duplicate = await this.prisma.grade.findFirst({
        where: {
          institutionId,
          id: { not: id },
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.shortCode ? [{ shortCode: dto.shortCode }] : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Ya existe un grado con el mismo nombre o código',
        );
      }
    }

    const updated = await this.prisma.grade.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.shortCode !== undefined && { shortCode: dto.shortCode }),
        ...(dto.orderNumber && { orderNumber: dto.orderNumber }),
        ...(dto.level && { level: dto.level }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return updated as unknown as GradeResponseDto;
  }

  /**
   * Eliminar un grado
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);

    // Verificar que no tenga secciones asociadas
    const hasSections = await this.prisma.section.findFirst({
      where: { gradeId: id },
    });

    if (hasSections) {
      throw new ConflictException(
        'No se puede eliminar un grado con secciones asociadas',
      );
    }

    await this.prisma.grade.delete({ where: { id } });
  }

  /**
   * Crear grados predeterminados según el nivel educativo
   */
  async createDefaults(
    institutionId: string,
    level: EducationLevel,
  ): Promise<GradeResponseDto[]> {
    const existingGrades = await this.prisma.grade.findMany({
      where: { institutionId, level },
    });

    if (existingGrades.length > 0) {
      throw new ConflictException(
        `Ya existen grados para el nivel ${level}`,
      );
    }

    let gradesToCreate: any[] = [];

    switch (level) {
      case EducationLevel.INICIAL:
        gradesToCreate = [
          { name: '3 años', shortCode: '3A', orderNumber: 1 },
          { name: '4 años', shortCode: '4A', orderNumber: 2 },
          { name: '5 años', shortCode: '5A', orderNumber: 3 },
        ];
        break;
      case EducationLevel.PRIMARIA:
        gradesToCreate = [
          { name: 'Primer Grado', shortCode: '1P', orderNumber: 1 },
          { name: 'Segundo Grado', shortCode: '2P', orderNumber: 2 },
          { name: 'Tercer Grado', shortCode: '3P', orderNumber: 3 },
          { name: 'Cuarto Grado', shortCode: '4P', orderNumber: 4 },
          { name: 'Quinto Grado', shortCode: '5P', orderNumber: 5 },
          { name: 'Sexto Grado', shortCode: '6P', orderNumber: 6 },
        ];
        break;
      case EducationLevel.SECUNDARIA:
        gradesToCreate = [
          { name: 'Primer Año', shortCode: '1S', orderNumber: 1 },
          { name: 'Segundo Año', shortCode: '2S', orderNumber: 2 },
          { name: 'Tercer Año', shortCode: '3S', orderNumber: 3 },
          { name: 'Cuarto Año', shortCode: '4S', orderNumber: 4 },
          { name: 'Quinto Año', shortCode: '5S', orderNumber: 5 },
        ];
        break;
    }

    await this.prisma.grade.createMany({
      data: gradesToCreate.map((g) => ({
        ...g,
        level,
        isActive: true,
        institutionId,
      })),
    });

    return this.findAll(institutionId, { level });
  }
}
