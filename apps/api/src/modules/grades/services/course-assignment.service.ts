/**
 * Servicio de Asignación de Cursos
 *
 * Gestiona la asignación de profesores a áreas curriculares y secciones.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateCourseAssignmentDto,
  BulkCourseAssignmentDto,
  UpdateCourseAssignmentDto,
  FilterCourseAssignmentDto,
  CourseAssignmentResponseDto,
} from '../dto';

@Injectable()
export class CourseAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una asignación de curso
   */
  async create(
    institutionId: string,
    dto: CreateCourseAssignmentDto,
  ): Promise<CourseAssignmentResponseDto> {
    // Verificar profesor
    const teacher = await this.prisma.user.findFirst({
      where: { id: dto.teacherId, institutionId, role: 'TEACHER' },
    });

    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Verificar área curricular
    const area = await this.prisma.curriculumArea.findFirst({
      where: { id: dto.curriculumAreaId, institutionId },
    });

    if (!area) {
      throw new NotFoundException('Área curricular no encontrada');
    }

    // Verificar sección
    const section = await this.prisma.section.findFirst({
      where: {
        id: dto.sectionId,
        institutionId,
        academicYearId: dto.academicYearId,
      },
    });

    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    // Verificar que no exista ya la asignación
    const existing = await this.prisma.courseAssignment.findFirst({
      where: {
        curriculumAreaId: dto.curriculumAreaId,
        sectionId: dto.sectionId,
        academicYearId: dto.academicYearId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una asignación para esta área y sección',
      );
    }

    const assignment = await this.prisma.courseAssignment.create({
      data: {
        teacherId: dto.teacherId,
        curriculumAreaId: dto.curriculumAreaId,
        sectionId: dto.sectionId,
        academicYearId: dto.academicYearId,
        isActive: dto.isActive ?? true,
        institutionId,
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return assignment as unknown as CourseAssignmentResponseDto;
  }

  /**
   * Asignación masiva de cursos
   */
  async createBulk(
    institutionId: string,
    dto: BulkCourseAssignmentDto,
  ): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    for (const sectionId of dto.sectionIds) {
      try {
        await this.create(institutionId, {
          teacherId: dto.teacherId,
          curriculumAreaId: dto.curriculumAreaId,
          sectionId,
          academicYearId: dto.academicYearId,
        });
        created++;
      } catch (error) {
        errors.push(`Error en sección ${sectionId}: ${error.message}`);
      }
    }

    return { created, errors };
  }

  /**
   * Obtener todas las asignaciones
   */
  async findAll(
    institutionId: string,
    filter: FilterCourseAssignmentDto,
  ): Promise<CourseAssignmentResponseDto[]> {
    const where: any = { institutionId };

    if (filter.teacherId) {
      where.teacherId = filter.teacherId;
    }

    if (filter.curriculumAreaId) {
      where.curriculumAreaId = filter.curriculumAreaId;
    }

    if (filter.sectionId) {
      where.sectionId = filter.sectionId;
    }

    if (filter.gradeId) {
      where.section = { gradeId: filter.gradeId };
    }

    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const assignments = await this.prisma.courseAssignment.findMany({
      where,
      orderBy: [
        { curriculumArea: { orderNumber: 'asc' } },
        { section: { grade: { orderNumber: 'asc' } } },
        { section: { name: 'asc' } },
      ],
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return assignments as unknown as CourseAssignmentResponseDto[];
  }

  /**
   * Obtener asignaciones de un profesor
   */
  async findByTeacher(
    institutionId: string,
    teacherId: string,
    academicYearId?: string,
  ): Promise<CourseAssignmentResponseDto[]> {
    const where: any = {
      institutionId,
      teacherId,
      isActive: true,
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const assignments = await this.prisma.courseAssignment.findMany({
      where,
      orderBy: [
        { curriculumArea: { orderNumber: 'asc' } },
        { section: { grade: { orderNumber: 'asc' } } },
      ],
      include: {
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
            _count: { select: { enrollments: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return assignments as unknown as CourseAssignmentResponseDto[];
  }

  /**
   * Obtener una asignación por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<CourseAssignmentResponseDto> {
    const assignment = await this.prisma.courseAssignment.findFirst({
      where: { id, institutionId },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación de curso no encontrada');
    }

    return assignment as unknown as CourseAssignmentResponseDto;
  }

  /**
   * Actualizar una asignación
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateCourseAssignmentDto,
  ): Promise<CourseAssignmentResponseDto> {
    await this.findOne(institutionId, id);

    // Verificar nuevo profesor si se proporciona
    if (dto.teacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: { id: dto.teacherId, institutionId, role: 'TEACHER' },
      });

      if (!teacher) {
        throw new NotFoundException('Profesor no encontrado');
      }
    }

    const updated = await this.prisma.courseAssignment.update({
      where: { id },
      data: {
        ...(dto.teacherId && { teacherId: dto.teacherId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        curriculumArea: {
          select: { id: true, name: true, code: true },
        },
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return updated as unknown as CourseAssignmentResponseDto;
  }

  /**
   * Eliminar una asignación
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);
    await this.prisma.courseAssignment.delete({ where: { id } });
  }

  /**
   * Obtener resumen de carga académica de un profesor
   */
  async getTeacherWorkload(
    institutionId: string,
    teacherId: string,
    academicYearId: string,
  ) {
    const assignments = await this.prisma.courseAssignment.findMany({
      where: {
        institutionId,
        teacherId,
        academicYearId,
        isActive: true,
      },
      include: {
        curriculumArea: { select: { name: true, code: true } },
        section: {
          include: {
            grade: { select: { name: true, level: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    const totalSections = assignments.length;
    const totalStudents = assignments.reduce(
      (sum, a) => sum + (a.section._count.enrollments || 0),
      0,
    );

    const byArea = assignments.reduce(
      (acc, a) => {
        const areaName = a.curriculumArea.name;
        if (!acc[areaName]) {
          acc[areaName] = { sections: 0, students: 0 };
        }
        acc[areaName].sections++;
        acc[areaName].students += a.section._count.enrollments || 0;
        return acc;
      },
      {} as Record<string, { sections: number; students: number }>,
    );

    return {
      teacherId,
      academicYearId,
      totalSections,
      totalStudents,
      byArea,
      assignments: assignments.map((a) => ({
        areaName: a.curriculumArea.name,
        areaCode: a.curriculumArea.code,
        gradeName: a.section.grade.name,
        sectionName: a.section.name,
        studentCount: a.section._count.enrollments,
      })),
    };
  }
}
