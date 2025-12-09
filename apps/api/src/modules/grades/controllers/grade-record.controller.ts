/**
 * Controlador de Registro de Calificaciones
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { GradeRecordService } from '../services/grade-record.service';
import {
  CreateGradeRecordDto,
  UpdateGradeRecordDto,
  BulkGradeRecordDto,
  FilterGradeRecordDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles, RequirePermissions, PERMISSIONS } from '../../rbac';
import { CurrentUser } from '../../auth';
import { Role } from '@prisma/client';

@Controller('grade-records')
@RequireTenant()
export class GradeRecordController {
  constructor(private readonly gradeRecordService: GradeRecordService) {}

  /**
   * Registrar calificación
   * POST /grade-records
   */
  @Post()
  @RequirePermissions(PERMISSIONS.GRADES_CREATE)
  async create(
    @TenantId() institutionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateGradeRecordDto,
  ) {
    return this.gradeRecordService.create(institutionId, teacherId, dto);
  }

  /**
   * Registro masivo de calificaciones
   * POST /grade-records/bulk
   */
  @Post('bulk')
  @RequirePermissions(PERMISSIONS.GRADES_CREATE)
  async createBulk(
    @TenantId() institutionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: BulkGradeRecordDto,
  ) {
    return this.gradeRecordService.createBulk(institutionId, teacherId, dto);
  }

  /**
   * Listar calificaciones
   * GET /grade-records
   */
  @Get()
  @RequirePermissions(PERMISSIONS.GRADES_READ)
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterGradeRecordDto,
  ) {
    return this.gradeRecordService.findAll(institutionId, filter);
  }

  /**
   * Obtener libreta de calificaciones de un estudiante
   * GET /grade-records/report-card/:studentId
   */
  @Get('report-card/:studentId')
  @RequirePermissions(PERMISSIONS.GRADES_READ)
  async getStudentReportCard(
    @TenantId() institutionId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
  ) {
    return this.gradeRecordService.getStudentReportCard(
      institutionId,
      studentId,
      academicPeriodId,
    );
  }

  /**
   * Obtener resumen de calificaciones de una sección
   * GET /grade-records/section-summary/:sectionId
   */
  @Get('section-summary/:sectionId')
  @RequirePermissions(PERMISSIONS.GRADES_READ)
  async getSectionGradesSummary(
    @TenantId() institutionId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Query('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Query('curriculumAreaId') curriculumAreaId?: string,
  ) {
    return this.gradeRecordService.getSectionGradesSummary(
      institutionId,
      sectionId,
      academicPeriodId,
      curriculumAreaId,
    );
  }

  /**
   * Obtener calificación por ID
   * GET /grade-records/:id
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.GRADES_READ)
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gradeRecordService.findOne(institutionId, id);
  }

  /**
   * Actualizar calificación
   * PUT /grade-records/:id
   */
  @Put(':id')
  @RequirePermissions(PERMISSIONS.GRADES_UPDATE)
  async update(
    @TenantId() institutionId: string,
    @CurrentUser('id') teacherId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeRecordDto,
  ) {
    return this.gradeRecordService.update(institutionId, teacherId, id, dto);
  }

  /**
   * Eliminar calificación
   * DELETE /grade-records/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.GRADES_DELETE)
  async remove(
    @TenantId() institutionId: string,
    @CurrentUser('id') teacherId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.gradeRecordService.remove(institutionId, teacherId, id);
  }
}
