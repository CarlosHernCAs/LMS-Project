/**
 * Controlador de Control de Asistencia
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AttendanceService } from '../services/attendance.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkAttendanceDto,
  FilterAttendanceDto,
  JustifyAbsenceDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles, RequirePermissions, PERMISSIONS } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('attendance')
@RequireTenant()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Registrar asistencia individual
   * POST /attendance
   */
  @Post()
  @RequirePermissions(PERMISSIONS.ATTENDANCE_CREATE)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendanceService.create(institutionId, dto);
  }

  /**
   * Registro masivo de asistencia
   * POST /attendance/bulk
   */
  @Post('bulk')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_CREATE)
  async createBulk(
    @TenantId() institutionId: string,
    @Body() dto: BulkAttendanceDto,
  ) {
    return this.attendanceService.createBulk(institutionId, dto);
  }

  /**
   * Listar registros de asistencia
   * GET /attendance
   */
  @Get()
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterAttendanceDto,
  ) {
    return this.attendanceService.findAll(institutionId, filter);
  }

  /**
   * Obtener reporte diario de una sección
   * GET /attendance/daily-report/:sectionId
   */
  @Get('daily-report/:sectionId')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  async getDailyReport(
    @TenantId() institutionId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getDailyReport(institutionId, sectionId, date);
  }

  /**
   * Obtener estadísticas de un estudiante
   * GET /attendance/student-stats/:studentId
   */
  @Get('student-stats/:studentId')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  async getStudentStats(
    @TenantId() institutionId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getStudentStats(
      institutionId,
      studentId,
      startDate,
      endDate,
    );
  }

  /**
   * Obtener estadísticas de una sección
   * GET /attendance/section-stats/:sectionId
   */
  @Get('section-stats/:sectionId')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  async getSectionStats(
    @TenantId() institutionId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getSectionStats(institutionId, sectionId, date);
  }

  /**
   * Obtener resumen por período académico
   * GET /attendance/period-summary/:sectionId/:academicPeriodId
   */
  @Get('period-summary/:sectionId/:academicPeriodId')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  async getPeriodSummary(
    @TenantId() institutionId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
  ) {
    return this.attendanceService.getPeriodSummary(
      institutionId,
      sectionId,
      academicPeriodId,
    );
  }

  /**
   * Obtener registro por ID
   * GET /attendance/:id
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attendanceService.findOne(institutionId, id);
  }

  /**
   * Actualizar registro de asistencia
   * PUT /attendance/:id
   */
  @Put(':id')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_UPDATE)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(institutionId, id, dto);
  }

  /**
   * Justificar una falta
   * PATCH /attendance/:id/justify
   */
  @Patch(':id/justify')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER, Role.SECRETARY)
  async justifyAbsence(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JustifyAbsenceDto,
  ) {
    return this.attendanceService.justifyAbsence(institutionId, id, dto);
  }

  /**
   * Eliminar registro de asistencia
   * DELETE /attendance/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.ATTENDANCE_DELETE)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.attendanceService.remove(institutionId, id);
  }
}
