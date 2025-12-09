/**
 * Servicio de Dashboard y Estadísticas
 *
 * Proporciona métricas y análisis para el LMS.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  DashboardFilterDto,
  InstitutionOverviewDto,
  AttendanceStatsDto,
  GradeStatsDto,
  EnrollmentStatsDto,
  TeacherDashboardDto,
  StudentDashboardDto,
  ParentDashboardDto,
  SystemAlertsDto,
} from '../dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener resumen general de la institución
   */
  async getInstitutionOverview(
    institutionId: string,
  ): Promise<InstitutionOverviewDto> {
    // Obtener información de la institución
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    // Obtener año académico activo
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { institutionId, isActive: true },
    });

    // Contar usuarios por rol
    const [students, teachers, parents] = await Promise.all([
      this.prisma.user.count({
        where: { institutionId, role: 'STUDENT', isActive: true },
      }),
      this.prisma.user.count({
        where: { institutionId, role: 'TEACHER', isActive: true },
      }),
      this.prisma.user.count({
        where: { institutionId, role: 'PARENT', isActive: true },
      }),
    ]);

    // Contar entidades académicas
    const [sections, grades, areas] = await Promise.all([
      this.prisma.section.count({
        where: { academicYearId: activeYear?.id },
      }),
      this.prisma.grade.count({ where: { institutionId } }),
      this.prisma.curriculumArea.count({ where: { institutionId } }),
    ]);

    // Calcular tasa de asistencia del día actual
    let attendanceRate = 0;
    if (activeYear) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttendance = await this.prisma.attendance.groupBy({
        by: ['status'],
        where: {
          institutionId,
          date: today,
        },
        _count: true,
      });

      const total = todayAttendance.reduce((sum, a) => sum + a._count, 0);
      const present = todayAttendance
        .filter((a) => ['PRESENT', 'LATE', 'JUSTIFIED'].includes(a.status))
        .reduce((sum, a) => sum + a._count, 0);

      attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    }

    // Calcular progreso académico (% de calificaciones registradas)
    let academicProgress = 0;
    if (activeYear) {
      const activePeriod = await this.prisma.academicPeriod.findFirst({
        where: { academicYearId: activeYear.id, isClosed: false },
        orderBy: { number: 'asc' },
      });

      if (activePeriod) {
        const totalExpected = await this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count FROM (
            SELECT e.id, c.id as comp_id
            FROM enrollments e
            CROSS JOIN competencies c
            JOIN curriculum_areas ca ON c."areaId" = ca.id
            WHERE e."academicYearId" = ${activeYear.id}
            AND e.status = 'ACTIVE'
          ) as expected
        `;

        const totalRegistered = await this.prisma.gradeRecord.count({
          where: { periodId: activePeriod.id },
        });

        const expected = Number(totalExpected[0]?.count || 0);
        academicProgress = expected > 0
          ? Math.round((totalRegistered / expected) * 100)
          : 0;
      }
    }

    return {
      institutionId,
      institutionName: institution.name,
      academicYear: activeYear
        ? {
            id: activeYear.id,
            name: activeYear.name,
            isActive: activeYear.isActive,
          }
        : null,
      counts: {
        totalStudents: students,
        totalTeachers: teachers,
        totalParents: parents,
        totalSections: sections,
        totalGrades: grades,
        totalCurriculumAreas: areas,
      },
      attendanceRate,
      academicProgress,
    };
  }

  /**
   * Obtener estadísticas de asistencia
   */
  async getAttendanceStats(
    institutionId: string,
    filter: DashboardFilterDto,
  ): Promise<AttendanceStatsDto> {
    // Determinar rango de fechas
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    // Obtener todas las asistencias en el período
    const attendances = await this.prisma.attendance.findMany({
      where: {
        institutionId,
        date: { gte: startDate, lte: endDate },
        ...(filter.sectionId && { sectionId: filter.sectionId }),
      },
      include: {
        section: {
          include: {
            grade: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Calcular estadísticas generales
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === 'PRESENT').length;
    const absent = attendances.filter((a) => a.status === 'ABSENT').length;
    const late = attendances.filter((a) => a.status === 'LATE').length;
    const justified = attendances.filter((a) => a.status === 'JUSTIFIED').length;

    // Agrupar por grado
    const gradeMap = new Map<string, { count: number; present: number; students: Set<string> }>();

    attendances.forEach((a) => {
      const gradeId = a.section.grade.id;
      const gradeName = a.section.grade.name;
      const key = `${gradeId}|${gradeName}`;

      if (!gradeMap.has(key)) {
        gradeMap.set(key, { count: 0, present: 0, students: new Set() });
      }

      const entry = gradeMap.get(key)!;
      entry.count++;
      entry.students.add(a.studentId);
      if (['PRESENT', 'LATE', 'JUSTIFIED'].includes(a.status)) {
        entry.present++;
      }
    });

    const byGrade = Array.from(gradeMap.entries()).map(([key, data]) => {
      const [gradeId, gradeName] = key.split('|');
      return {
        gradeId,
        gradeName,
        attendanceRate: data.count > 0
          ? Math.round((data.present / data.count) * 100)
          : 0,
        totalStudents: data.students.size,
      };
    });

    // Calcular tendencia diaria
    const trendMap = new Map<string, { total: number; present: number }>();

    attendances.forEach((a) => {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { total: 0, present: 0 });
      }
      const entry = trendMap.get(dateKey)!;
      entry.total++;
      if (['PRESENT', 'LATE', 'JUSTIFIED'].includes(a.status)) {
        entry.present++;
      }
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        attendanceRate: data.total > 0
          ? Math.round((data.present / data.total) * 100)
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      overall: {
        totalRecords: total,
        present,
        absent,
        late,
        justified,
        attendanceRate: total > 0
          ? Math.round(((present + late + justified) / total) * 100)
          : 0,
      },
      byGrade,
      trend,
    };
  }

  /**
   * Obtener estadísticas de calificaciones
   */
  async getGradeStats(
    institutionId: string,
    filter: DashboardFilterDto,
  ): Promise<GradeStatsDto> {
    // Obtener período activo o especificado
    let period;
    if (filter.academicPeriodId) {
      period = await this.prisma.academicPeriod.findUnique({
        where: { id: filter.academicPeriodId },
      });
    } else {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { institutionId, isActive: true },
      });
      if (activeYear) {
        period = await this.prisma.academicPeriod.findFirst({
          where: { academicYearId: activeYear.id },
          orderBy: { number: 'desc' },
        });
      }
    }

    if (!period) {
      return {
        period: { id: '', name: 'Sin período activo' },
        distribution: { AD: 0, A: 0, B: 0, C: 0 },
        byArea: [],
        studentsAtRisk: [],
      };
    }

    // Obtener calificaciones del período
    const grades = await this.prisma.gradeRecord.findMany({
      where: {
        periodId: period.id,
        enrollment: {
          section: {
            ...(filter.gradeId && { gradeId: filter.gradeId }),
            ...(filter.sectionId && { id: filter.sectionId }),
          },
        },
      },
      include: {
        competency: {
          include: {
            area: { select: { id: true, name: true } },
          },
        },
        enrollment: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            section: {
              include: {
                grade: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // Calcular distribución general
    const distribution = {
      AD: grades.filter((g) => g.score === 'AD').length,
      A: grades.filter((g) => g.score === 'A').length,
      B: grades.filter((g) => g.score === 'B').length,
      C: grades.filter((g) => g.score === 'C').length,
    };

    // Calcular distribución por área
    const areaMap = new Map<
      string,
      { name: string; grades: string[] }
    >();

    grades.forEach((g) => {
      const areaId = g.competency.area.id;
      const areaName = g.competency.area.name;
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, { name: areaName, grades: [] });
      }
      areaMap.get(areaId)!.grades.push(g.score);
    });

    const byArea = Array.from(areaMap.entries()).map(([areaId, data]) => {
      const dist = {
        AD: data.grades.filter((g) => g === 'AD').length,
        A: data.grades.filter((g) => g === 'A').length,
        B: data.grades.filter((g) => g === 'B').length,
        C: data.grades.filter((g) => g === 'C').length,
      };

      // Calcular rendimiento promedio (AD=4, A=3, B=2, C=1)
      const scoreValues = { AD: 4, A: 3, B: 2, C: 1 };
      const totalScore = data.grades.reduce(
        (sum, g) => sum + (scoreValues[g as keyof typeof scoreValues] || 0),
        0,
      );
      const avgPerformance = data.grades.length > 0
        ? Math.round((totalScore / data.grades.length / 4) * 100)
        : 0;

      return {
        areaId,
        areaName: data.name,
        distribution: dist,
        averagePerformance: avgPerformance,
      };
    });

    // Identificar estudiantes en riesgo (con C en alguna área)
    const studentGradesMap = new Map<
      string,
      { name: string; section: string; areasAtRisk: Set<string> }
    >();

    grades
      .filter((g) => g.score === 'C')
      .forEach((g) => {
        const studentId = g.enrollment.student.id;
        const studentName = `${g.enrollment.student.user.lastName}, ${g.enrollment.student.user.firstName}`;
        const sectionName = `${g.enrollment.section.grade.name} ${g.enrollment.section.name}`;

        if (!studentGradesMap.has(studentId)) {
          studentGradesMap.set(studentId, {
            name: studentName,
            section: sectionName,
            areasAtRisk: new Set(),
          });
        }
        studentGradesMap.get(studentId)!.areasAtRisk.add(g.competency.area.name);
      });

    const studentsAtRisk = Array.from(studentGradesMap.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.name,
        sectionName: data.section,
        areasAtRisk: Array.from(data.areasAtRisk),
      }))
      .slice(0, 20); // Limitar a 20

    return {
      period: { id: period.id, name: period.name },
      distribution,
      byArea,
      studentsAtRisk,
    };
  }

  /**
   * Obtener estadísticas de matrícula
   */
  async getEnrollmentStats(
    institutionId: string,
    academicYearId?: string,
  ): Promise<EnrollmentStatsDto> {
    // Obtener año académico
    let year;
    if (academicYearId) {
      year = await this.prisma.academicYear.findUnique({
        where: { id: academicYearId },
      });
    } else {
      year = await this.prisma.academicYear.findFirst({
        where: { institutionId, isActive: true },
      });
    }

    if (!year) {
      throw new NotFoundException('Año académico no encontrado');
    }

    // Obtener matrículas
    const enrollments = await this.prisma.enrollment.findMany({
      where: { academicYearId: year.id },
      include: {
        section: {
          include: {
            grade: { select: { id: true, name: true, level: true } },
          },
        },
      },
    });

    // Contar por estado
    const byStatus = {
      ACTIVE: enrollments.filter((e) => e.status === 'ACTIVE').length,
      TRANSFERRED: enrollments.filter((e) => e.status === 'TRANSFERRED').length,
      WITHDRAWN: enrollments.filter((e) => e.status === 'WITHDRAWN').length,
      GRADUATED: enrollments.filter((e) => e.status === 'GRADUATED').length,
    };

    // Obtener secciones con capacidad
    const sections = await this.prisma.section.findMany({
      where: { academicYearId: year.id },
      include: {
        grade: { select: { id: true, name: true, level: true } },
        _count: {
          select: {
            enrollments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    // Agrupar por grado
    const gradeMap = new Map<
      string,
      { name: string; level: string; students: number; capacity: number }
    >();

    sections.forEach((s) => {
      const gradeId = s.grade.id;
      if (!gradeMap.has(gradeId)) {
        gradeMap.set(gradeId, {
          name: s.grade.name,
          level: s.grade.level,
          students: 0,
          capacity: 0,
        });
      }
      const entry = gradeMap.get(gradeId)!;
      entry.students += s._count.enrollments;
      entry.capacity += s.capacity;
    });

    const byGrade = Array.from(gradeMap.entries()).map(([gradeId, data]) => ({
      gradeId,
      gradeName: data.name,
      level: data.level,
      totalStudents: data.students,
      capacity: data.capacity,
      occupancyRate: data.capacity > 0
        ? Math.round((data.students / data.capacity) * 100)
        : 0,
    }));

    // Por sección
    const bySection = sections.map((s) => ({
      sectionId: s.id,
      sectionName: s.name,
      gradeName: s.grade.name,
      totalStudents: s._count.enrollments,
      capacity: s.capacity,
      occupancyRate: s.capacity > 0
        ? Math.round((s._count.enrollments / s.capacity) * 100)
        : 0,
    }));

    return {
      academicYear: { id: year.id, name: year.name },
      totalEnrollments: enrollments.length,
      byStatus,
      byGrade,
      bySection,
    };
  }

  /**
   * Dashboard para profesores
   */
  async getTeacherDashboard(
    institutionId: string,
    teacherId: string,
  ): Promise<TeacherDashboardDto> {
    // Obtener información del profesor
    const teacher = await this.prisma.user.findFirst({
      where: { id: teacherId, institutionId, role: 'TEACHER' },
    });

    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Obtener año académico activo
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { institutionId, isActive: true },
    });

    // Obtener cursos asignados
    const assignments = await this.prisma.courseAssignment.findMany({
      where: {
        teacherId,
        academicYearId: activeYear?.id,
      },
      include: {
        area: { select: { id: true, name: true } },
        section: {
          include: {
            grade: { select: { name: true } },
            _count: {
              select: {
                enrollments: { where: { status: 'ACTIVE' } },
              },
            },
          },
        },
      },
    });

    const assignedCourses = assignments.map((a) => ({
      areaId: a.area.id,
      areaName: a.area.name,
      sectionId: a.section.id,
      sectionName: a.section.name,
      gradeName: a.section.grade.name,
      studentCount: a.section._count.enrollments,
    }));

    // Calificaciones pendientes
    const activePeriod = activeYear
      ? await this.prisma.academicPeriod.findFirst({
          where: { academicYearId: activeYear.id, isClosed: false },
          orderBy: { number: 'asc' },
        })
      : null;

    const pendingGrades: TeacherDashboardDto['pendingGrades'] = [];

    if (activePeriod) {
      for (const assignment of assignments) {
        const enrollmentCount = await this.prisma.enrollment.count({
          where: { sectionId: assignment.sectionId, status: 'ACTIVE' },
        });

        const competencyCount = await this.prisma.competency.count({
          where: { areaId: assignment.areaId },
        });

        const expectedGrades = enrollmentCount * competencyCount;

        const registeredGrades = await this.prisma.gradeRecord.count({
          where: {
            periodId: activePeriod.id,
            competency: { areaId: assignment.areaId },
            enrollment: { sectionId: assignment.sectionId },
          },
        });

        const pending = expectedGrades - registeredGrades;
        if (pending > 0) {
          pendingGrades.push({
            areaName: assignment.area.name,
            sectionName: `${assignment.section.grade.name} ${assignment.section.name}`,
            periodName: activePeriod.name,
            pendingCount: pending,
          });
        }
      }
    }

    // Asistencia de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Promise.all(
      assignments
        .filter(
          (v, i, a) =>
            a.findIndex((t) => t.sectionId === v.sectionId) === i,
        ) // Unique sections
        .map(async (a) => {
          const attendance = await this.prisma.attendance.findMany({
            where: {
              sectionId: a.sectionId,
              date: today,
              type: 'DAILY',
            },
          });

          return {
            sectionId: a.sectionId,
            sectionName: `${a.section.grade.name} ${a.section.name}`,
            registered: attendance.length > 0,
            presentCount: attendance.filter((att) =>
              ['PRESENT', 'LATE', 'JUSTIFIED'].includes(att.status),
            ).length,
            totalStudents: a.section._count.enrollments,
          };
        }),
    );

    return {
      teacherId,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      assignedCourses,
      pendingGrades,
      todayAttendance,
      recentActivity: [], // Simplificado
    };
  }

  /**
   * Obtener alertas del sistema
   */
  async getSystemAlerts(institutionId: string): Promise<SystemAlertsDto> {
    const alerts: SystemAlertsDto['alerts'] = [];

    // Verificar asistencia no registrada hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeYear = await this.prisma.academicYear.findFirst({
      where: { institutionId, isActive: true },
    });

    if (activeYear) {
      const sectionsWithoutAttendance = await this.prisma.section.findMany({
        where: {
          academicYearId: activeYear.id,
          attendances: {
            none: { date: today },
          },
        },
        include: {
          grade: { select: { name: true } },
        },
      });

      if (sectionsWithoutAttendance.length > 0) {
        alerts.push({
          id: 'attendance-missing',
          type: 'WARNING',
          category: 'ATTENDANCE',
          title: 'Asistencia pendiente',
          message: `${sectionsWithoutAttendance.length} secciones sin registro de asistencia hoy`,
          count: sectionsWithoutAttendance.length,
          actionUrl: '/attendance',
          createdAt: new Date(),
        });
      }

      // Verificar estudiantes con muchas faltas
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const studentsWithHighAbsence = await this.prisma.$queryRaw<
        { studentId: string; absences: bigint }[]
      >`
        SELECT "studentId", COUNT(*) as absences
        FROM attendances
        WHERE "institutionId" = ${institutionId}
        AND date >= ${thirtyDaysAgo}
        AND status = 'ABSENT'
        GROUP BY "studentId"
        HAVING COUNT(*) >= 5
      `;

      if (studentsWithHighAbsence.length > 0) {
        alerts.push({
          id: 'high-absence',
          type: 'WARNING',
          category: 'ATTENDANCE',
          title: 'Estudiantes con alta inasistencia',
          message: `${studentsWithHighAbsence.length} estudiantes con 5 o más faltas en los últimos 30 días`,
          count: studentsWithHighAbsence.length,
          actionUrl: '/reports/attendance',
          createdAt: new Date(),
        });
      }

      // Verificar período académico por cerrar
      const activePeriod = await this.prisma.academicPeriod.findFirst({
        where: { academicYearId: activeYear.id, isClosed: false },
        orderBy: { number: 'asc' },
      });

      if (activePeriod) {
        const daysUntilEnd = Math.ceil(
          (activePeriod.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
          alerts.push({
            id: 'period-ending',
            type: 'INFO',
            category: 'GRADES',
            title: 'Período académico por finalizar',
            message: `El ${activePeriod.name} termina en ${daysUntilEnd} días`,
            actionUrl: '/grades',
            createdAt: new Date(),
          });
        }
      }
    }

    return { alerts };
  }
}
