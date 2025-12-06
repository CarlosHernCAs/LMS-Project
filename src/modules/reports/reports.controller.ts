import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ReportsService,
  GradeReportParams,
  AttendanceReportParams,
  ReportResult,
} from './reports.service';

/**
 * Controlador de Reportes
 *
 * Maneja las solicitudes HTTP para generación de reportes.
 * Los errores del servicio son manejados por el Circuit Breaker,
 * por lo que este controlador siempre responde (aunque sea con degradación).
 */
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Genera reporte de calificaciones
   *
   * GET /reports/grades?institutionId=xxx&academicYearId=yyy
   *
   * Respuestas posibles:
   * - 200: Reporte generado exitosamente
   * - 200 con degraded=true: Servicio no disponible, se retorna fallback
   */
  @Get('grades')
  async getGradeReport(
    @Query('institutionId') institutionId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('periodId') periodId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('studentId') studentId?: string,
  ): Promise<ReportResult> {
    const params: GradeReportParams = {
      institutionId,
      academicYearId,
      periodId,
      sectionId,
      studentId,
    };

    return this.reportsService.generateGradeReport(params);
  }

  /**
   * Genera reporte de asistencia
   *
   * GET /reports/attendance?institutionId=xxx&startDate=2025-01-01&endDate=2025-01-31
   */
  @Get('attendance')
  async getAttendanceReport(
    @Query('institutionId') institutionId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sectionId') sectionId?: string,
  ): Promise<ReportResult> {
    const params: AttendanceReportParams = {
      institutionId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      sectionId,
    };

    return this.reportsService.generateAttendanceReport(params);
  }

  /**
   * Obtiene estadísticas del dashboard
   *
   * GET /reports/dashboard/:institutionId/stats
   */
  @Get('dashboard/:institutionId/stats')
  async getDashboardStats(
    @Param('institutionId') institutionId: string,
  ): Promise<ReportResult> {
    return this.reportsService.getDashboardStats(institutionId);
  }

  /**
   * Exporta un reporte a PDF
   *
   * POST /reports/export/pdf
   */
  @Post('export/pdf')
  @HttpCode(HttpStatus.OK)
  async exportToPdf(
    @Body() body: { reportType: string; params: unknown },
  ): Promise<ReportResult> {
    return this.reportsService.exportToPdf(body.reportType, body.params);
  }
}
