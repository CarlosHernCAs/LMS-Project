import { Injectable, Logger } from '@nestjs/common';
import {
  UseCircuitBreaker,
  GracefulDegradation,
  Retry,
  Timeout,
} from '../../common/resilience';

/**
 * Tipos de reportes disponibles
 */
export interface ReportResult {
  success: boolean;
  data?: unknown;
  generatedAt: Date;
  cached?: boolean;
  degraded?: boolean;
  message?: string;
}

export interface GradeReportParams {
  institutionId: string;
  academicYearId: string;
  periodId?: string;
  sectionId?: string;
  studentId?: string;
}

export interface AttendanceReportParams {
  institutionId: string;
  startDate: Date;
  endDate: Date;
  sectionId?: string;
}

/**
 * Servicio de Reportes con Tolerancia a Fallos
 *
 * Este servicio demuestra cómo implementar resiliencia:
 * - Si falla la generación de reportes, el resto del sistema sigue funcionando
 * - Los usuarios reciben mensajes claros sobre la disponibilidad
 * - Se usan fallbacks para operaciones críticas
 *
 * IMPORTANTE: Este módulo puede fallar sin afectar:
 * - Autenticación
 * - Registro de notas
 * - Asistencia
 * - Comunicación
 * - Cualquier otra funcionalidad core
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  // Caché simple en memoria para fallback
  private reportCache: Map<string, { data: unknown; timestamp: Date }> =
    new Map();

  /**
   * Genera reporte de calificaciones
   *
   * Usa Circuit Breaker:
   * - Si falla 3 veces consecutivas, el circuito se abre
   * - Retorna datos en caché o mensaje de no disponible
   * - Después de 30 segundos, intenta recuperarse
   */
  @UseCircuitBreaker({
    name: 'reports-grades',
    failureThreshold: 3,
    recoveryTimeout: 30000,
    timeout: 15000,
    fallback: function () {
      // 'this' es el contexto del servicio
      return {
        success: false,
        degraded: true,
        message:
          'El servicio de reportes no está disponible temporalmente. ' +
          'Sus datos están seguros. Por favor intente en unos minutos.',
        generatedAt: new Date(),
      } as ReportResult;
    },
  })
  async generateGradeReport(params: GradeReportParams): Promise<ReportResult> {
    this.logger.log(`Generating grade report for institution ${params.institutionId}`);

    // Simular operación que puede fallar (en producción, sería la lógica real)
    const report = await this.fetchGradeData(params);

    // Guardar en caché para fallback futuro
    const cacheKey = `grades-${params.institutionId}-${params.academicYearId}`;
    this.reportCache.set(cacheKey, { data: report, timestamp: new Date() });

    return {
      success: true,
      data: report,
      generatedAt: new Date(),
    };
  }

  /**
   * Genera reporte de asistencia
   *
   * Usa Retry + Timeout:
   * - Reintenta hasta 3 veces con backoff exponencial
   * - Timeout de 10 segundos por intento
   */
  @Retry({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
  })
  @Timeout(10000)
  async generateAttendanceReport(
    params: AttendanceReportParams,
  ): Promise<ReportResult> {
    this.logger.log(`Generating attendance report for institution ${params.institutionId}`);

    const report = await this.fetchAttendanceData(params);

    return {
      success: true,
      data: report,
      generatedAt: new Date(),
    };
  }

  /**
   * Obtiene estadísticas del dashboard
   *
   * Usa GracefulDegradation:
   * - Si falla, retorna datos vacíos en lugar de error
   * - El dashboard sigue funcionando pero sin esta sección
   */
  @GracefulDegradation(() => ({
    success: false,
    degraded: true,
    data: {
      totalStudents: null,
      averageGrade: null,
      attendanceRate: null,
      message: 'Estadísticas no disponibles temporalmente',
    },
    generatedAt: new Date(),
  }))
  async getDashboardStats(institutionId: string): Promise<ReportResult> {
    this.logger.log(`Fetching dashboard stats for institution ${institutionId}`);

    // Esta operación puede fallar sin afectar el resto del dashboard
    const stats = await this.calculateStats(institutionId);

    return {
      success: true,
      data: stats,
      generatedAt: new Date(),
    };
  }

  /**
   * Exporta reporte a PDF
   *
   * Operación pesada con circuit breaker propio
   */
  @UseCircuitBreaker({
    name: 'reports-pdf-export',
    failureThreshold: 2,
    recoveryTimeout: 60000, // 1 minuto antes de reintentar
    timeout: 30000, // PDFs pueden tardar
    fallback: () => ({
      success: false,
      degraded: true,
      message:
        'La exportación a PDF no está disponible. ' +
        'Puede ver el reporte en pantalla o intentar más tarde.',
      generatedAt: new Date(),
    }),
  })
  async exportToPdf(reportType: string, params: unknown): Promise<ReportResult> {
    this.logger.log(`Exporting ${reportType} report to PDF`);

    // Lógica de generación de PDF
    const pdfBuffer = await this.generatePdf(reportType, params);

    return {
      success: true,
      data: { buffer: pdfBuffer, filename: `${reportType}-${Date.now()}.pdf` },
      generatedAt: new Date(),
    };
  }

  // ============================================
  // Métodos privados (simulados para ejemplo)
  // ============================================

  private async fetchGradeData(params: GradeReportParams): Promise<unknown> {
    // En producción: consulta a la base de datos
    // Aquí simulamos posible fallo
    await this.simulateOperation(500, 0.1); // 10% probabilidad de fallo

    return {
      institution: params.institutionId,
      academicYear: params.academicYearId,
      grades: [
        // Datos de ejemplo
      ],
    };
  }

  private async fetchAttendanceData(
    params: AttendanceReportParams,
  ): Promise<unknown> {
    await this.simulateOperation(300, 0.15);

    return {
      institution: params.institutionId,
      dateRange: { start: params.startDate, end: params.endDate },
      records: [],
    };
  }

  private async calculateStats(institutionId: string): Promise<unknown> {
    await this.simulateOperation(200, 0.2);

    return {
      institutionId,
      totalStudents: 450,
      averageGrade: 14.5,
      attendanceRate: 92.3,
    };
  }

  private async generatePdf(
    _reportType: string,
    _params: unknown,
  ): Promise<Buffer> {
    await this.simulateOperation(2000, 0.25);

    return Buffer.from('PDF content');
  }

  /**
   * Simula una operación con posible fallo
   */
  private async simulateOperation(
    delayMs: number,
    failureProbability: number,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    if (Math.random() < failureProbability) {
      throw new Error('Simulated service failure');
    }
  }
}
