/**
 * Controlador de Matrículas
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { EnrollmentService } from '../services/enrollment.service';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  BulkEnrollmentDto,
  TransferEnrollmentDto,
  FilterEnrollmentDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('enrollments')
@RequireTenant()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  /**
   * Crear matrícula
   * POST /enrollments
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR, Role.SECRETARY)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentService.create(institutionId, dto);
  }

  /**
   * Matrícula masiva
   * POST /enrollments/bulk
   */
  @Post('bulk')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createBulk(
    @TenantId() institutionId: string,
    @Body() dto: BulkEnrollmentDto,
  ) {
    return this.enrollmentService.createBulk(institutionId, dto);
  }

  /**
   * Listar matrículas
   * GET /enrollments
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterEnrollmentDto,
  ) {
    return this.enrollmentService.findAll(institutionId, filter);
  }

  /**
   * Estadísticas de matrícula por sección
   * GET /enrollments/stats
   */
  @Get('stats')
  @Roles(
    Role.INSTITUTION_ADMIN,
    Role.ACADEMIC_COORDINATOR,
    Role.SECRETARY,
  )
  async getStats(
    @TenantId() institutionId: string,
    @Query('academicYearId', ParseUUIDPipe) academicYearId: string,
  ) {
    return this.enrollmentService.getStatsBySection(institutionId, academicYearId);
  }

  /**
   * Obtener matrícula activa de un estudiante
   * GET /enrollments/student/:studentId
   */
  @Get('student/:studentId')
  async findByStudent(
    @TenantId() institutionId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.enrollmentService.findActiveByStudent(
      institutionId,
      studentId,
      academicYearId,
    );
  }

  /**
   * Obtener matrícula por ID
   * GET /enrollments/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentService.findOne(institutionId, id);
  }

  /**
   * Actualizar matrícula
   * PUT /enrollments/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR, Role.SECRETARY)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(institutionId, id, dto);
  }

  /**
   * Trasladar estudiante a otra sección
   * PATCH /enrollments/:id/transfer
   */
  @Patch(':id/transfer')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async transfer(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferEnrollmentDto,
  ) {
    return this.enrollmentService.transfer(institutionId, id, dto);
  }

  /**
   * Retirar estudiante
   * PATCH /enrollments/:id/withdraw
   */
  @Patch(':id/withdraw')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async withdraw(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.enrollmentService.withdraw(institutionId, id, reason);
  }
}
