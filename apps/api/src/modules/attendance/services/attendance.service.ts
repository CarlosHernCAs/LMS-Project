/**
 * Servicio de Control de Asistencia
 *
 * Gestiona el registro y seguimiento de asistencia de estudiantes.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkAttendanceDto,
  FilterAttendanceDto,
  AttendanceResponseDto,
  StudentAttendanceStatsDto,
  SectionAttendanceStatsDto,
  DailyAttendanceReportDto,
  JustifyAbsenceDto,
  AttendanceStatus,
  AttendanceType,
} from '../dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registrar asistencia individual
   */
  async create(
    institutionId: string,
    dto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    // Verificar que el estudiante está matriculado en la sección
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

    // Verificar si ya existe registro para esta fecha y tipo
    const existing = await this.prisma.attendance.findFirst({
      where: {
        studentId: dto.studentId,
        sectionId: dto.sectionId,
        date: new Date(dto.date),
        type: dto.type || 'DAILY',
        ...(dto.curriculumAreaId && { curriculumAreaId: dto.curriculumAreaId }),
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un registro de asistencia para esta fecha',
      );
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        sectionId: dto.sectionId,
        date: new Date(dto.date),
        status: dto.status,
        type: dto.type || 'DAILY',
        curriculumAreaId: dto.curriculumAreaId,
        observations: dto.observations,
        justificationReason: dto.justificationReason,
        institutionId,
      },
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
        curriculumArea: { select: { id: true, name: true, code: true } },
      },
    });

    return attendance as unknown as AttendanceResponseDto;
  }

  /**
   * Registro masivo de asistencia (para toda una sección)
   */
  async createBulk(
    institutionId: string,
    dto: BulkAttendanceDto,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    const date = new Date(dto.date);

    for (const record of dto.records) {
      try {
        // Verificar si ya existe
        const existing = await this.prisma.attendance.findFirst({
          where: {
            studentId: record.studentId,
            sectionId: dto.sectionId,
            date,
            type: dto.type || 'DAILY',
            ...(dto.curriculumAreaId && { curriculumAreaId: dto.curriculumAreaId }),
          },
        });

        if (existing) {
          // Actualizar existente
          await this.prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              observations: record.observations,
            },
          });
          updated++;
        } else {
          // Crear nuevo
          await this.prisma.attendance.create({
            data: {
              studentId: record.studentId,
              sectionId: dto.sectionId,
              date,
              status: record.status,
              type: dto.type || 'DAILY',
              curriculumAreaId: dto.curriculumAreaId,
              observations: record.observations,
              institutionId,
            },
          });
          created++;
        }
      } catch (error) {
        errors.push(
          `Error al registrar asistencia del estudiante ${record.studentId}: ${error.message}`,
        );
      }
    }

    return { created, updated, errors };
  }

  /**
   * Obtener registros de asistencia
   */
  async findAll(
    institutionId: string,
    filter: FilterAttendanceDto,
  ): Promise<AttendanceResponseDto[]> {
    const where: any = { institutionId };

    if (filter.studentId) {
      where.studentId = filter.studentId;
    }

    if (filter.sectionId) {
      where.sectionId = filter.sectionId;
    }

    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) {
        where.date.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.date.lte = new Date(filter.endDate);
      }
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.curriculumAreaId) {
      where.curriculumAreaId = filter.curriculumAreaId;
    }

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { student: { user: { lastName: 'asc' } } }],
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
        curriculumArea: { select: { id: true, name: true, code: true } },
      },
    });

    return records as unknown as AttendanceResponseDto[];
  }

  /**
   * Obtener un registro por ID
   */
  async findOne(
    institutionId: string,
    id: string,
  ): Promise<AttendanceResponseDto> {
    const record = await this.prisma.attendance.findFirst({
      where: { id, institutionId },
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
        curriculumArea: { select: { id: true, name: true, code: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    return record as unknown as AttendanceResponseDto;
  }

  /**
   * Actualizar registro de asistencia
   */
  async update(
    institutionId: string,
    id: string,
    dto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    await this.findOne(institutionId, id);

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.observations !== undefined && { observations: dto.observations }),
        ...(dto.justificationReason !== undefined && {
          justificationReason: dto.justificationReason,
        }),
      },
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
        curriculumArea: { select: { id: true, name: true, code: true } },
      },
    });

    return updated as unknown as AttendanceResponseDto;
  }

  /**
   * Justificar una falta
   */
  async justifyAbsence(
    institutionId: string,
    id: string,
    dto: JustifyAbsenceDto,
  ): Promise<AttendanceResponseDto> {
    const existing = await this.findOne(institutionId, id);

    if (existing.status !== 'ABSENT') {
      throw new BadRequestException(
        'Solo se pueden justificar registros con estado AUSENTE',
      );
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        status: 'JUSTIFIED',
        justificationReason: dto.reason,
        observations: dto.observations || existing.observations,
      },
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
      },
    });

    return updated as unknown as AttendanceResponseDto;
  }

  /**
   * Eliminar registro de asistencia
   */
  async remove(institutionId: string, id: string): Promise<void> {
    await this.findOne(institutionId, id);
    await this.prisma.attendance.delete({ where: { id } });
  }

  /**
   * Obtener reporte de asistencia diaria de una sección
   */
  async getDailyReport(
    institutionId: string,
    sectionId: string,
    date: string,
  ): Promise<DailyAttendanceReportDto> {
    // Obtener información de la sección
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, institutionId },
      include: {
        grade: { select: { name: true, level: true } },
      },
    });

    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    // Obtener estudiantes matriculados
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

    // Obtener registros de asistencia del día
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        sectionId,
        date: new Date(date),
        type: 'DAILY',
      },
    });

    // Crear mapa de asistencia por estudiante
    const attendanceMap = new Map(
      attendanceRecords.map((r) => [r.studentId, r]),
    );

    // Construir reporte
    const records = enrollments.map((e) => {
      const record = attendanceMap.get(e.studentId);
      return {
        studentId: e.studentId,
        studentCode: e.student.studentCode,
        studentName: `${e.student.user.lastName}, ${e.student.user.firstName}`,
        status: record?.status as AttendanceStatus || null,
        observations: record?.observations || null,
      };
    });

    // Calcular resumen
    const summary = {
      total: enrollments.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      justified: records.filter((r) => r.status === 'JUSTIFIED').length,
    };

    return {
      date,
      sectionId,
      sectionName: section.name,
      gradeName: section.grade.name,
      records,
      summary,
    };
  }

  /**
   * Obtener estadísticas de asistencia de un estudiante
   */
  async getStudentStats(
    institutionId: string,
    studentId: string,
    startDate: string,
    endDate: string,
  ): Promise<StudentAttendanceStatsDto> {
    // Obtener información del estudiante
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, institutionId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Obtener registros de asistencia en el período
    const records = await this.prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        type: 'DAILY',
      },
    });

    // Calcular estadísticas
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const justified = records.filter((r) => r.status === 'JUSTIFIED').length;
    const totalDays = records.length;
    const attendanceRate = totalDays > 0
      ? Math.round(((present + late + justified) / totalDays) * 100)
      : 0;

    return {
      studentId,
      studentCode: student.studentCode,
      studentName: `${student.user.lastName}, ${student.user.firstName}`,
      totalDays,
      present,
      absent,
      late,
      justified,
      attendanceRate,
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Obtener estadísticas de asistencia de una sección
   */
  async getSectionStats(
    institutionId: string,
    sectionId: string,
    date: string,
  ): Promise<SectionAttendanceStatsDto> {
    // Obtener información de la sección
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, institutionId },
      include: {
        grade: { select: { name: true, level: true } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    // Obtener registros del día
    const records = await this.prisma.attendance.findMany({
      where: {
        sectionId,
        date: new Date(date),
        type: 'DAILY',
      },
    });

    // Calcular estadísticas
    const totalStudents = section._count.enrollments;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const justified = records.filter((r) => r.status === 'JUSTIFIED').length;
    const attendanceRate = totalStudents > 0
      ? Math.round(((present + late + justified) / totalStudents) * 100)
      : 0;

    return {
      sectionId,
      sectionName: section.name,
      gradeName: section.grade.name,
      date,
      totalStudents,
      present,
      absent,
      late,
      justified,
      attendanceRate,
    };
  }

  /**
   * Obtener resumen de asistencia por período académico
   */
  async getPeriodSummary(
    institutionId: string,
    sectionId: string,
    academicPeriodId: string,
  ) {
    // Obtener período
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!period) {
      throw new NotFoundException('Período académico no encontrado');
    }

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

    // Obtener todos los registros del período
    const records = await this.prisma.attendance.findMany({
      where: {
        sectionId,
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        type: 'DAILY',
      },
    });

    // Calcular estadísticas por estudiante
    const studentStats = enrollments.map((e) => {
      const studentRecords = records.filter((r) => r.studentId === e.studentId);
      const present = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const absent = studentRecords.filter((r) => r.status === 'ABSENT').length;
      const late = studentRecords.filter((r) => r.status === 'LATE').length;
      const justified = studentRecords.filter((r) => r.status === 'JUSTIFIED').length;
      const total = studentRecords.length;

      return {
        studentId: e.studentId,
        studentCode: e.student.studentCode,
        studentName: `${e.student.user.lastName}, ${e.student.user.firstName}`,
        present,
        absent,
        late,
        justified,
        total,
        attendanceRate: total > 0
          ? Math.round(((present + late + justified) / total) * 100)
          : 0,
      };
    });

    // Calcular promedio general
    const avgAttendanceRate = studentStats.length > 0
      ? Math.round(
          studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) /
            studentStats.length,
        )
      : 0;

    return {
      periodName: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      students: studentStats,
      summary: {
        totalStudents: studentStats.length,
        avgAttendanceRate,
        studentsAtRisk: studentStats.filter((s) => s.attendanceRate < 80).length,
      },
    };
  }
}
