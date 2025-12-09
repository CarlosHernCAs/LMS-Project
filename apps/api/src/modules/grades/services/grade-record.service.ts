/**
 * Servicio de Registro de Calificaciones
 *
 * Gestiona las calificaciones por competencia según CNEB.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateGradeRecordDto,
  UpdateGradeRecordDto,
  BulkGradeRecordDto,
  FilterGradeRecordDto,
  GradeRecordResponseDto,
  StudentReportCardDto,
  AchievementLevel,
} from '../dto';

@Injectable()
export class GradeRecordService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un registro de calificación
   */
  async create(
    institutionId: string,
    teacherId: string,
    dto: CreateGradeRecordDto,
  ): Promise<GradeRecordResponseDto> {
    // Verificar que el profesor tiene asignado este curso
    const assignment = await this.verifyTeacherAssignment(
      institutionId,
      teacherId,
      dto.sectionId,
      dto.competencyId,
    );

    // Verificar estudiante matriculado en la sección
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: dto.studentId,
        sectionId: dto.sectionId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new BadRequestException(
        'El estudiante no está matriculado en esta sección',
      );
    }

    // Verificar que el período académico es válido
    const period = await this.prisma.academicPeriod.findFirst({
      where: {
        id: dto.academicPeriodId,
        academicYearId: assignment.academicYearId,
      },
    });

    if (!period) {
      throw new NotFoundException('Período académico no encontrado');
    }

    // Verificar si ya existe una calificación
    const existing = await this.prisma.gradeRecord.findFirst({
      where: {
        studentId: dto.studentId,
        competencyId: dto.competencyId,
        academicPeriodId: dto.academicPeriodId,
        sectionId: dto.sectionId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una calificación para este estudiante, competencia y período',
      );
    }

    const gradeRecord = await this.prisma.gradeRecord.create({
      data: {
        studentId: dto.studentId,
        competencyId: dto.competencyId,
        academicPeriodId: dto.academicPeriodId,
        sectionId: dto.sectionId,
        achievementLevel: dto.achievementLevel,
        numericGrade: dto.numericGrade,
        observations: dto.observations,
        institutionId,
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        competency: {
          include: {
            curriculumArea: { select: { id: true, name: true } },
          },
        },
        academicPeriod: { select: { id: true, name: true, orderNumber: true } },
      },
    });

    return gradeRecord as unknown as GradeRecordResponseDto;
  }

  /**
   * Registro masivo de calificaciones
   */
  async createBulk(
    institutionId: string,
    teacherId: string,
    dto: BulkGradeRecordDto,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    // Verificar asignación del profesor
    await this.verifyTeacherAssignment(
      institutionId,
      teacherId,
      dto.sectionId,
      dto.competencyId,
    );

    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    for (const grade of dto.grades) {
      try {
        // Verificar si ya existe
        const existing = await this.prisma.gradeRecord.findFirst({
          where: {
            studentId: grade.studentId,
            competencyId: dto.competencyId,
            academicPeriodId: dto.academicPeriodId,
            sectionId: dto.sectionId,
          },
        });

        if (existing) {
          // Actualizar existente
          await this.prisma.gradeRecord.update({
            where: { id: existing.id },
            data: {
              achievementLevel: grade.achievementLevel,
              numericGrade: grade.numericGrade,
              observations: grade.observations,
            },
          });
          updated++;
        } else {
          // Crear nuevo
          await this.prisma.gradeRecord.create({
            data: {
              studentId: grade.studentId,
              competencyId: dto.competencyId,
              academicPeriodId: dto.academicPeriodId,
              sectionId: dto.sectionId,
              achievementLevel: grade.achievementLevel,
              numericGrade: grade.numericGrade,
              observations: grade.observations,
              institutionId,
            },
          });
          created++;
        }
      } catch (error) {
        errors.push(
          `Error al registrar calificación del estudiante ${grade.studentId}: ${error.message}`,
        );
      }
    }

    return { created, updated, errors };
  }

  /**
   * Obtener calificaciones
   */
  async findAll(
    institutionId: string,
    filter: FilterGradeRecordDto,
  ): Promise<GradeRecordResponseDto[]> {
    const where: any = { institutionId };

    if (filter.studentId) {
      where.studentId = filter.studentId;
    }

    if (filter.competencyId) {
      where.competencyId = filter.competencyId;
    }

    if (filter.curriculumAreaId) {
      where.competency = { curriculumAreaId: filter.curriculumAreaId };
    }

    if (filter.academicPeriodId) {
      where.academicPeriodId = filter.academicPeriodId;
    }

    if (filter.sectionId) {
      where.sectionId = filter.sectionId;
    }

    if (filter.achievementLevel) {
      where.achievementLevel = filter.achievementLevel;
    }

    const records = await this.prisma.gradeRecord.findMany({
      where,
      orderBy: [
        { student: { user: { lastName: 'asc' } } },
        { competency: { orderNumber: 'asc' } },
      ],
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        competency: {
          include: {
            curriculumArea: { select: { id: true, name: true } },
          },
        },
        academicPeriod: { select: { id: true, name: true, orderNumber: true } },
      },
    });

    return records as unknown as GradeRecordResponseDto[];
  }

  /**
   * Obtener una calificación por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<GradeRecordResponseDto> {
    const record = await this.prisma.gradeRecord.findFirst({
      where: { id, institutionId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        competency: {
          include: {
            curriculumArea: { select: { id: true, name: true } },
          },
        },
        academicPeriod: { select: { id: true, name: true, orderNumber: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('Registro de calificación no encontrado');
    }

    return record as unknown as GradeRecordResponseDto;
  }

  /**
   * Actualizar una calificación
   */
  async update(
    institutionId: string,
    teacherId: string,
    id: string,
    dto: UpdateGradeRecordDto,
  ): Promise<GradeRecordResponseDto> {
    const existing = await this.findOne(institutionId, id);

    // Verificar que el profesor tiene permiso
    await this.verifyTeacherAssignment(
      institutionId,
      teacherId,
      existing.sectionId,
      existing.competencyId,
    );

    const updated = await this.prisma.gradeRecord.update({
      where: { id },
      data: {
        ...(dto.achievementLevel && { achievementLevel: dto.achievementLevel }),
        ...(dto.numericGrade !== undefined && { numericGrade: dto.numericGrade }),
        ...(dto.observations !== undefined && { observations: dto.observations }),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        competency: {
          include: {
            curriculumArea: { select: { id: true, name: true } },
          },
        },
        academicPeriod: { select: { id: true, name: true, orderNumber: true } },
      },
    });

    return updated as unknown as GradeRecordResponseDto;
  }

  /**
   * Eliminar una calificación
   */
  async remove(
    institutionId: string,
    teacherId: string,
    id: string,
  ): Promise<void> {
    const existing = await this.findOne(institutionId, id);

    // Verificar que el profesor tiene permiso
    await this.verifyTeacherAssignment(
      institutionId,
      teacherId,
      existing.sectionId,
      existing.competencyId,
    );

    await this.prisma.gradeRecord.delete({ where: { id } });
  }

  /**
   * Obtener libreta de calificaciones de un estudiante
   */
  async getStudentReportCard(
    institutionId: string,
    studentId: string,
    academicPeriodId: string,
  ): Promise<StudentReportCardDto> {
    // Obtener información del estudiante y matrícula
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, institutionId, status: 'ACTIVE' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        section: {
          include: {
            grade: { select: { name: true, level: true } },
          },
        },
        academicYear: { select: { name: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    // Obtener período
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!period) {
      throw new NotFoundException('Período académico no encontrado');
    }

    // Obtener todas las calificaciones del estudiante en el período
    const grades = await this.prisma.gradeRecord.findMany({
      where: {
        studentId,
        academicPeriodId,
        sectionId: enrollment.sectionId,
      },
      include: {
        competency: {
          include: {
            curriculumArea: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [
        { competency: { curriculumArea: { orderNumber: 'asc' } } },
        { competency: { orderNumber: 'asc' } },
      ],
    });

    // Agrupar por área curricular
    const gradesByArea = grades.reduce(
      (acc, grade) => {
        const areaId = grade.competency.curriculumArea.id;
        if (!acc[areaId]) {
          acc[areaId] = {
            areaName: grade.competency.curriculumArea.name,
            areaCode: grade.competency.curriculumArea.code || '',
            competencies: [],
          };
        }
        acc[areaId].competencies.push({
          competencyName: grade.competency.name,
          competencyCode: grade.competency.code || '',
          achievementLevel: grade.achievementLevel as AchievementLevel,
          numericGrade: grade.numericGrade,
          observations: grade.observations,
        });
        return acc;
      },
      {} as Record<string, any>,
    );

    // Calcular nivel final por área
    const areasWithFinalLevel = Object.values(gradesByArea).map((area: any) => ({
      ...area,
      finalLevel: this.calculateFinalLevel(area.competencies),
    }));

    return {
      studentId,
      studentCode: enrollment.student.studentCode,
      studentName: `${enrollment.student.user.lastName}, ${enrollment.student.user.firstName}`,
      sectionName: enrollment.section.name,
      gradeName: enrollment.section.grade.name,
      academicYearName: enrollment.academicYear.name,
      periodName: period.name,
      grades: areasWithFinalLevel,
    };
  }

  /**
   * Obtener resumen de calificaciones de una sección
   */
  async getSectionGradesSummary(
    institutionId: string,
    sectionId: string,
    academicPeriodId: string,
    curriculumAreaId?: string,
  ) {
    // Obtener estudiantes de la sección
    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId, status: 'ACTIVE' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { student: { user: { lastName: 'asc' } } },
    });

    // Obtener competencias del área (o todas)
    const competencies = await this.prisma.competency.findMany({
      where: {
        institutionId,
        isActive: true,
        ...(curriculumAreaId && { curriculumAreaId }),
      },
      include: {
        curriculumArea: { select: { name: true, code: true } },
      },
      orderBy: [
        { curriculumArea: { orderNumber: 'asc' } },
        { orderNumber: 'asc' },
      ],
    });

    // Obtener todas las calificaciones
    const grades = await this.prisma.gradeRecord.findMany({
      where: {
        sectionId,
        academicPeriodId,
        ...(curriculumAreaId && { competency: { curriculumAreaId } }),
      },
    });

    // Crear matriz de calificaciones
    const gradeMatrix = enrollments.map((enrollment) => {
      const studentGrades = competencies.map((competency) => {
        const grade = grades.find(
          (g) =>
            g.studentId === enrollment.studentId &&
            g.competencyId === competency.id,
        );
        return {
          competencyId: competency.id,
          competencyName: competency.name,
          areaName: competency.curriculumArea.name,
          achievementLevel: grade?.achievementLevel || null,
          numericGrade: grade?.numericGrade || null,
        };
      });

      return {
        studentId: enrollment.studentId,
        studentCode: enrollment.student.studentCode,
        studentName: `${enrollment.student.user.lastName}, ${enrollment.student.user.firstName}`,
        grades: studentGrades,
      };
    });

    // Estadísticas por competencia
    const statistics = competencies.map((competency) => {
      const competencyGrades = grades.filter((g) => g.competencyId === competency.id);
      const total = competencyGrades.length;
      const byLevel = {
        AD: competencyGrades.filter((g) => g.achievementLevel === 'AD').length,
        A: competencyGrades.filter((g) => g.achievementLevel === 'A').length,
        B: competencyGrades.filter((g) => g.achievementLevel === 'B').length,
        C: competencyGrades.filter((g) => g.achievementLevel === 'C').length,
      };

      return {
        competencyId: competency.id,
        competencyName: competency.name,
        areaName: competency.curriculumArea.name,
        total,
        pending: enrollments.length - total,
        byLevel,
      };
    });

    return {
      students: gradeMatrix,
      statistics,
      totalStudents: enrollments.length,
      totalCompetencies: competencies.length,
    };
  }

  /**
   * Verificar que el profesor tiene asignado el curso
   */
  private async verifyTeacherAssignment(
    institutionId: string,
    teacherId: string,
    sectionId: string,
    competencyId: string,
  ) {
    // Obtener el área curricular de la competencia
    const competency = await this.prisma.competency.findUnique({
      where: { id: competencyId },
    });

    if (!competency) {
      throw new NotFoundException('Competencia no encontrada');
    }

    const assignment = await this.prisma.courseAssignment.findFirst({
      where: {
        institutionId,
        teacherId,
        sectionId,
        curriculumAreaId: competency.curriculumAreaId,
        isActive: true,
      },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'No tiene asignado este curso para esta sección',
      );
    }

    return assignment;
  }

  /**
   * Calcular nivel de logro final (moda o promedio)
   */
  private calculateFinalLevel(
    competencies: { achievementLevel: AchievementLevel }[],
  ): AchievementLevel {
    if (competencies.length === 0) return AchievementLevel.C;

    const counts = {
      AD: 0,
      A: 0,
      B: 0,
      C: 0,
    };

    competencies.forEach((c) => {
      counts[c.achievementLevel]++;
    });

    // Retornar el nivel más frecuente (moda)
    let maxCount = 0;
    let finalLevel: AchievementLevel = AchievementLevel.C;

    for (const [level, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        finalLevel = level as AchievementLevel;
      }
    }

    return finalLevel;
  }
}
