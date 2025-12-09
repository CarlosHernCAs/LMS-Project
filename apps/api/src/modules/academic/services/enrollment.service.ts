/**
 * Servicio de Matrículas
 *
 * Gestiona la matrícula de estudiantes en secciones.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  BulkEnrollmentDto,
  TransferEnrollmentDto,
  FilterEnrollmentDto,
  EnrollmentResponseDto,
  EnrollmentStatus,
} from '../dto';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una matrícula
   */
  async create(
    institutionId: string,
    dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    // Verificar estudiante
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, institutionId },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Verificar sección y año académico
    const section = await this.prisma.section.findFirst({
      where: {
        id: dto.sectionId,
        institutionId,
        academicYearId: dto.academicYearId,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!section) {
      throw new NotFoundException('Sección no encontrada para este año académico');
    }

    // Verificar capacidad
    if (section.maxCapacity && section._count.enrollments >= section.maxCapacity) {
      throw new ConflictException(
        `La sección ha alcanzado su capacidad máxima de ${section.maxCapacity} estudiantes`,
      );
    }

    // Verificar que no esté ya matriculado en el mismo año
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        'El estudiante ya tiene una matrícula activa para este año académico',
      );
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        sectionId: dto.sectionId,
        academicYearId: dto.academicYearId,
        enrollmentDate: dto.enrollmentDate
          ? new Date(dto.enrollmentDate)
          : new Date(),
        status: dto.status ?? 'ACTIVE',
        observations: dto.observations,
        institutionId,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return enrollment as unknown as EnrollmentResponseDto;
  }

  /**
   * Matrícula masiva de estudiantes
   */
  async createBulk(
    institutionId: string,
    dto: BulkEnrollmentDto,
  ): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    // Verificar sección
    const section = await this.prisma.section.findFirst({
      where: {
        id: dto.sectionId,
        institutionId,
        academicYearId: dto.academicYearId,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    // Verificar capacidad disponible
    const availableSlots = section.maxCapacity
      ? section.maxCapacity - section._count.enrollments
      : Infinity;

    if (dto.studentIds.length > availableSlots) {
      throw new ConflictException(
        `Solo hay ${availableSlots} lugares disponibles en la sección`,
      );
    }

    for (const studentId of dto.studentIds) {
      try {
        await this.create(institutionId, {
          studentId,
          sectionId: dto.sectionId,
          academicYearId: dto.academicYearId,
          enrollmentDate: dto.enrollmentDate,
          status: EnrollmentStatus.ACTIVE,
        });
        created++;
      } catch (error) {
        errors.push(`Error al matricular estudiante ${studentId}: ${error.message}`);
      }
    }

    return { created, errors };
  }

  /**
   * Obtener todas las matrículas
   */
  async findAll(
    institutionId: string,
    filter: FilterEnrollmentDto,
  ): Promise<EnrollmentResponseDto[]> {
    const where: any = { institutionId };

    if (filter.sectionId) {
      where.sectionId = filter.sectionId;
    }

    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.gradeId) {
      where.section = { gradeId: filter.gradeId };
    }

    if (filter.search) {
      where.OR = [
        { student: { studentCode: { contains: filter.search, mode: 'insensitive' } } },
        {
          student: {
            user: {
              OR: [
                { firstName: { contains: filter.search, mode: 'insensitive' } },
                { lastName: { contains: filter.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      orderBy: [
        { section: { grade: { orderNumber: 'asc' } } },
        { section: { name: 'asc' } },
        { student: { user: { lastName: 'asc' } } },
      ],
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return enrollments as unknown as EnrollmentResponseDto[];
  }

  /**
   * Obtener una matrícula por ID
   */
  async findOne(institutionId: string, id: string): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id, institutionId },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    return enrollment as unknown as EnrollmentResponseDto;
  }

  /**
   * Obtener matrícula activa de un estudiante
   */
  async findActiveByStudent(
    institutionId: string,
    studentId: string,
    academicYearId?: string,
  ): Promise<EnrollmentResponseDto | null> {
    const where: any = {
      institutionId,
      studentId,
      status: 'ACTIVE',
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where,
      include: {
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { academicYear: { startDate: 'desc' } },
    });

    return enrollment as unknown as EnrollmentResponseDto | null;
  }

  /**
   * Actualizar una matrícula
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Si cambia de sección, verificar capacidad
    if (dto.sectionId && dto.sectionId !== existing.sectionId) {
      const newSection = await this.prisma.section.findFirst({
        where: {
          id: dto.sectionId,
          institutionId,
          academicYearId: existing.academicYearId,
        },
        include: {
          _count: { select: { enrollments: true } },
        },
      });

      if (!newSection) {
        throw new NotFoundException('Nueva sección no encontrada');
      }

      if (
        newSection.maxCapacity &&
        newSection._count.enrollments >= newSection.maxCapacity
      ) {
        throw new ConflictException(
          `La sección destino ha alcanzado su capacidad máxima`,
        );
      }
    }

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: {
        ...(dto.sectionId && { sectionId: dto.sectionId }),
        ...(dto.status && { status: dto.status }),
        ...(dto.observations !== undefined && { observations: dto.observations }),
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return updated as unknown as EnrollmentResponseDto;
  }

  /**
   * Trasladar estudiante a otra sección
   */
  async transfer(
    institutionId: string,
    id: string,
    dto: TransferEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const existing = await this.findOne(institutionId, id);

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se pueden trasladar matrículas activas',
      );
    }

    // Verificar nueva sección
    const newSection = await this.prisma.section.findFirst({
      where: {
        id: dto.newSectionId,
        institutionId,
        academicYearId: existing.academicYearId,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!newSection) {
      throw new NotFoundException('Nueva sección no encontrada');
    }

    if (
      newSection.maxCapacity &&
      newSection._count.enrollments >= newSection.maxCapacity
    ) {
      throw new ConflictException(
        `La sección destino ha alcanzado su capacidad máxima`,
      );
    }

    // Actualizar matrícula anterior como trasladada
    await this.prisma.enrollment.update({
      where: { id },
      data: {
        status: 'TRANSFERRED',
        observations: `${existing.observations || ''}\nTrasladado: ${dto.reason || 'Sin motivo especificado'}`.trim(),
      },
    });

    // Crear nueva matrícula
    const newEnrollment = await this.prisma.enrollment.create({
      data: {
        studentId: existing.studentId,
        sectionId: dto.newSectionId,
        academicYearId: existing.academicYearId,
        enrollmentDate: dto.transferDate
          ? new Date(dto.transferDate)
          : new Date(),
        status: 'ACTIVE',
        observations: `Trasladado desde sección anterior`,
        institutionId,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return newEnrollment as unknown as EnrollmentResponseDto;
  }

  /**
   * Retirar a un estudiante
   */
  async withdraw(
    institutionId: string,
    id: string,
    reason?: string,
  ): Promise<EnrollmentResponseDto> {
    const existing = await this.findOne(institutionId, id);

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se pueden retirar matrículas activas',
      );
    }

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        observations: `${existing.observations || ''}\nRetiro: ${reason || 'Sin motivo especificado'}`.trim(),
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return updated as unknown as EnrollmentResponseDto;
  }

  /**
   * Obtener estadísticas de matrícula por sección
   */
  async getStatsBySection(institutionId: string, academicYearId: string) {
    const sections = await this.prisma.section.findMany({
      where: { institutionId, academicYearId },
      include: {
        grade: { select: { name: true, level: true } },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const stats = await Promise.all(
      sections.map(async (section) => {
        const statusCounts = await this.prisma.enrollment.groupBy({
          by: ['status'],
          where: { sectionId: section.id },
          _count: true,
        });

        return {
          sectionId: section.id,
          sectionName: section.name,
          gradeName: section.grade.name,
          level: section.grade.level,
          maxCapacity: section.maxCapacity,
          totalEnrollments: section._count.enrollments,
          availableSlots: section.maxCapacity
            ? section.maxCapacity - section._count.enrollments
            : null,
          byStatus: statusCounts.reduce(
            (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
            {},
          ),
        };
      }),
    );

    return stats;
  }
}
