/**
 * DTOs para Dashboard y Estadísticas
 */

import { IsOptional, IsUUID, IsDateString } from 'class-validator';

/**
 * DTO para filtros de dashboard
 */
export class DashboardFilterDto {
  @IsUUID('4', { message: 'El ID del año académico debe ser válido' })
  @IsOptional()
  academicYearId?: string;

  @IsUUID('4', { message: 'El ID del período académico debe ser válido' })
  @IsOptional()
  academicPeriodId?: string;

  @IsUUID('4', { message: 'El ID del grado debe ser válido' })
  @IsOptional()
  gradeId?: string;

  @IsUUID('4', { message: 'El ID de la sección debe ser válido' })
  @IsOptional()
  sectionId?: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  @IsOptional()
  endDate?: string;
}

/**
 * Resumen general de la institución
 */
export class InstitutionOverviewDto {
  institutionId: string;
  institutionName: string;
  academicYear: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  counts: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalSections: number;
    totalGrades: number;
    totalCurriculumAreas: number;
  };
  attendanceRate: number; // Porcentaje promedio de asistencia
  academicProgress: number; // Porcentaje de calificaciones registradas
}

/**
 * Estadísticas de asistencia
 */
export class AttendanceStatsDto {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    justified: number;
    attendanceRate: number;
  };
  byGrade: {
    gradeId: string;
    gradeName: string;
    attendanceRate: number;
    totalStudents: number;
  }[];
  trend: {
    date: string;
    attendanceRate: number;
  }[];
}

/**
 * Estadísticas de calificaciones
 */
export class GradeStatsDto {
  period: {
    id: string;
    name: string;
  };
  distribution: {
    AD: number; // Logro destacado
    A: number; // Logro esperado
    B: number; // En proceso
    C: number; // En inicio
  };
  byArea: {
    areaId: string;
    areaName: string;
    distribution: {
      AD: number;
      A: number;
      B: number;
      C: number;
    };
    averagePerformance: number; // 0-100
  }[];
  studentsAtRisk: {
    studentId: string;
    studentName: string;
    sectionName: string;
    areasAtRisk: string[];
  }[];
}

/**
 * Estadísticas de matrícula
 */
export class EnrollmentStatsDto {
  academicYear: {
    id: string;
    name: string;
  };
  totalEnrollments: number;
  byStatus: {
    ACTIVE: number;
    TRANSFERRED: number;
    WITHDRAWN: number;
    GRADUATED: number;
  };
  byGrade: {
    gradeId: string;
    gradeName: string;
    level: string;
    totalStudents: number;
    capacity: number;
    occupancyRate: number;
  }[];
  bySection: {
    sectionId: string;
    sectionName: string;
    gradeName: string;
    totalStudents: number;
    capacity: number;
    occupancyRate: number;
  }[];
}

/**
 * Dashboard del profesor
 */
export class TeacherDashboardDto {
  teacherId: string;
  teacherName: string;
  assignedCourses: {
    areaId: string;
    areaName: string;
    sectionId: string;
    sectionName: string;
    gradeName: string;
    studentCount: number;
  }[];
  pendingGrades: {
    areaName: string;
    sectionName: string;
    periodName: string;
    pendingCount: number;
  }[];
  todayAttendance: {
    sectionId: string;
    sectionName: string;
    registered: boolean;
    presentCount: number;
    totalStudents: number;
  }[];
  recentActivity: {
    type: 'GRADE' | 'ATTENDANCE';
    description: string;
    timestamp: Date;
  }[];
}

/**
 * Dashboard del estudiante
 */
export class StudentDashboardDto {
  studentId: string;
  studentName: string;
  enrollment: {
    sectionName: string;
    gradeName: string;
    academicYear: string;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    justified: number;
    attendanceRate: number;
  };
  grades: {
    areaName: string;
    competencies: {
      name: string;
      level: string;
    }[];
    overallLevel: string;
  }[];
  upcomingEvents: {
    title: string;
    date: Date;
    type: string;
  }[];
}

/**
 * Dashboard del padre
 */
export class ParentDashboardDto {
  parentId: string;
  parentName: string;
  children: {
    studentId: string;
    studentName: string;
    sectionName: string;
    gradeName: string;
    attendanceRate: number;
    academicPerformance: string; // AD, A, B, C
    recentGrades: {
      areaName: string;
      level: string;
      date: Date;
    }[];
    recentAttendance: {
      date: Date;
      status: string;
    }[];
  }[];
}

/**
 * Actividad reciente
 */
export class RecentActivityDto {
  activities: {
    id: string;
    type: 'ENROLLMENT' | 'GRADE' | 'ATTENDANCE' | 'USER';
    action: string;
    description: string;
    userId: string;
    userName: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }[];
}

/**
 * Alertas del sistema
 */
export class SystemAlertsDto {
  alerts: {
    id: string;
    type: 'WARNING' | 'ERROR' | 'INFO';
    category: 'ATTENDANCE' | 'GRADES' | 'ENROLLMENT' | 'SYSTEM';
    title: string;
    message: string;
    count?: number;
    actionUrl?: string;
    createdAt: Date;
  }[];
}
