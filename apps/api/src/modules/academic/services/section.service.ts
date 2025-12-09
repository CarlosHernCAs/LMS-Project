/**
 * Servicio de Secciones
 *
 * Gestiona las secciones (A, B, C) de cada grado.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  FilterSectionDto,
  SectionResponseDto,
} from '../dto';

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una nueva sección
   */
  async create(
    institutionId: string,
    dto: CreateSectionDto,
  ): Promise<SectionResponseDto> {
    // Verificar que el grado existe
    const grade = await this.prisma.grade.findFirst({
      where: { id: dto.gradeId, institutionId },
    });

    if (!grade) {
      throw new NotFoundException('Grado no encontrado');
    }

    // Verificar que el año académico existe
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, institutionId },
    });

    if (!academicYear) {
      throw new NotFoundException('Año académico no encontrado');
    }

    // Verificar que no exista una sección con el mismo nombre en el mismo grado y año
    const existing = await this.prisma.section.findFirst({
      where: {
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe la sección "${dto.name}" para este grado y año académico`,
      );
    }

    // Verificar tutor si se proporciona
    if (dto.tutorId) {
      const tutor = await this.prisma.user.findFirst({
        where: {
          id: dto.tutorId,
          institutionId,
          role: 'TEACHER',
        },
      });

      if (!tutor) {
        throw new NotFoundException('Tutor no encontrado o no es un docente');
      }
    }

    const section = await this.prisma.section.create({
      data: {
        name: dto.name,
        gradeId: dto.gradeId,
        academicYearId: dto.academicYearId,
        maxCapacity: dto.maxCapacity ?? 30,
        tutorId: dto.tutorId,
        isActive: dto.isActive ?? true,
        institutionId,
      },
      include: {
        grade: { select: { id: true, name: true, level: true } },
        academicYear: { select: { id: true, name: true } },
        tutor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return section as unknown as SectionResponseDto;
  }

  /**
   * Obtener todas las secciones
   */
  async findAll(
    institutionId: string,
    filter: FilterSectionDto,
  ): Promise<SectionResponseDto[]> {
    const where: any = { institutionId };

    if (filter.gradeId) {
      where.gradeId = filter.gradeId;
    }

    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const sections = await this.prisma.section.findMany({
      where,
      orderBy: [{ grade: { orderNumber: 'asc' } }, { name: 'asc' }],
      include: {
        grade: { select: { id: true, name: true, level: true } },
        academicYear: { select: { id: true, name: true } },
        tutor: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return sections as unknown as SectionResponseDto[];
  }

  /**
   * Obtener una sección por ID
   */
  async findOne(institutionId: string, id: string): Promise<SectionResponseDto> {
    const section = await this.prisma.section.findFirst({
      where: { id, institutionId },
      include: {
        grade: { select: { id: true, name: true, level: true } },
        academicYear: { select: { id: true, name: true } },
        tutor: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    return section as unknown as SectionResponseDto;
  }

  /**
   * Obtener estudiantes de una sección
   */
  async getStudents(institutionId: string, id: string) {
    await this.findOne(institutionId, id);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        sectionId: id,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            lastName: 'asc',
          },
        },
      },
    });

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.studentId,
      studentCode: e.student.studentCode,
      firstName: e.student.user.firstName,
      lastName: e.student.user.lastName,
      email: e.student.user.email,
      enrollmentDate: e.enrollmentDate,
    }));
  }

  /**
   * Actualizar una sección
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateSectionDto,
  ): Promise<SectionResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Verificar nombre único si se cambia
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.section.findFirst({
        where: {
          gradeId: existing.gradeId,
          academicYearId: existing.academicYearId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Ya existe la sección "${dto.name}" para este grado y año académico`,
        );
      }
    }

    // Verificar tutor si se proporciona
    if (dto.tutorId) {
      const tutor = await this.prisma.user.findFirst({
        where: {
          id: dto.tutorId,
          institutionId,
          role: 'TEACHER',
        },
      });

      if (!tutor) {
        throw new NotFoundException('Tutor no encontrado o no es un docente');
      }
    }

    const updated = await this.prisma.section.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
        ...(dto.tutorId !== undefined && { tutorId: dto.tutorId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        grade: { select: { id: true, name: true, level: true } },
        academicYear: { select: { id: true, name: true } },
        tutor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updated as unknown as SectionResponseDto;
  }

  /**
   * Eliminar una sección
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);

    // Verificar que no tenga matrículas
    const hasEnrollments = await this.prisma.enrollment.findFirst({
      where: { sectionId: id },
    });

    if (hasEnrollments) {
      throw new ConflictException(
        'No se puede eliminar una sección con estudiantes matriculados',
      );
    }

    await this.prisma.section.delete({ where: { id } });
  }

  /**
   * Crear secciones automáticamente para un grado
   */
  async createBulk(
    institutionId: string,
    gradeId: string,
    academicYearId: string,
    count: number,
    maxCapacity: number = 30,
  ): Promise<SectionResponseDto[]> {
    // Verificar grado y año académico
    const grade = await this.prisma.grade.findFirst({
      where: { id: gradeId, institutionId },
    });

    if (!grade) {
      throw new NotFoundException('Grado no encontrado');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, institutionId },
    });

    if (!academicYear) {
      throw new NotFoundException('Año académico no encontrado');
    }

    // Verificar si ya existen secciones
    const existingSections = await this.prisma.section.findMany({
      where: { gradeId, academicYearId },
    });

    if (existingSections.length > 0) {
      throw new ConflictException(
        'Ya existen secciones para este grado y año académico',
      );
    }

    const sectionNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, count);

    await this.prisma.section.createMany({
      data: sectionNames.map((name) => ({
        name,
        gradeId,
        academicYearId,
        maxCapacity,
        isActive: true,
        institutionId,
      })),
    });

    return this.findAll(institutionId, { gradeId, academicYearId });
  }
}
