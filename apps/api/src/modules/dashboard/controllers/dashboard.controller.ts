/**
 * Controlador de Dashboard y Estadísticas
 */

import {
  Controller,
  Get,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { DashboardService } from '../services/dashboard.service';
import { DashboardFilterDto } from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles, RequirePermissions, PERMISSIONS } from '../../rbac';
import { CurrentUser } from '../../auth';
import { Role } from '@prisma/client';

@Controller('dashboard')
@RequireTenant()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Obtener resumen general de la institución
   * GET /dashboard/overview
   */
  @Get('overview')
  @Roles(
    Role.INSTITUTION_ADMIN,
    Role.ACADEMIC_COORDINATOR,
    Role.SECRETARY,
  )
  async getOverview(@TenantId() institutionId: string) {
    return this.dashboardService.getInstitutionOverview(institutionId);
  }

  /**
   * Obtener estadísticas de asistencia
   * GET /dashboard/attendance-stats
   */
  @Get('attendance-stats')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_REPORT)
  async getAttendanceStats(
    @TenantId() institutionId: string,
    @Query() filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getAttendanceStats(institutionId, filter);
  }

  /**
   * Obtener estadísticas de calificaciones
   * GET /dashboard/grade-stats
   */
  @Get('grade-stats')
  @Roles(
    Role.INSTITUTION_ADMIN,
    Role.ACADEMIC_COORDINATOR,
  )
  async getGradeStats(
    @TenantId() institutionId: string,
    @Query() filter: DashboardFilterDto,
  ) {
    return this.dashboardService.getGradeStats(institutionId, filter);
  }

  /**
   * Obtener estadísticas de matrícula
   * GET /dashboard/enrollment-stats
   */
  @Get('enrollment-stats')
  @Roles(
    Role.INSTITUTION_ADMIN,
    Role.ACADEMIC_COORDINATOR,
    Role.SECRETARY,
  )
  async getEnrollmentStats(
    @TenantId() institutionId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.dashboardService.getEnrollmentStats(institutionId, academicYearId);
  }

  /**
   * Dashboard del profesor
   * GET /dashboard/teacher
   */
  @Get('teacher')
  @Roles(Role.TEACHER, Role.TUTOR)
  async getTeacherDashboard(
    @TenantId() institutionId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.dashboardService.getTeacherDashboard(institutionId, teacherId);
  }

  /**
   * Obtener alertas del sistema
   * GET /dashboard/alerts
   */
  @Get('alerts')
  @Roles(
    Role.INSTITUTION_ADMIN,
    Role.ACADEMIC_COORDINATOR,
    Role.SECRETARY,
  )
  async getAlerts(@TenantId() institutionId: string) {
    return this.dashboardService.getSystemAlerts(institutionId);
  }
}
