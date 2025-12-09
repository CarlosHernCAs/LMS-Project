/**
 * Controlador de Períodos Académicos (Bimestres/Trimestres)
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

import { AcademicPeriodService } from '../services/academic-period.service';
import {
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  FilterAcademicPeriodDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('academic-periods')
@RequireTenant()
export class AcademicPeriodController {
  constructor(private readonly academicPeriodService: AcademicPeriodService) {}

  /**
   * Crear período académico
   * POST /academic-periods
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateAcademicPeriodDto,
  ) {
    return this.academicPeriodService.create(institutionId, dto);
  }

  /**
   * Crear períodos automáticamente (bimestres o trimestres)
   * POST /academic-periods/bulk/:academicYearId
   */
  @Post('bulk/:academicYearId')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createBulk(
    @TenantId() institutionId: string,
    @Param('academicYearId', ParseUUIDPipe) academicYearId: string,
    @Query('type') type: 'BIMESTRE' | 'TRIMESTRE' = 'BIMESTRE',
  ) {
    return this.academicPeriodService.createBulk(institutionId, academicYearId, type);
  }

  /**
   * Listar períodos académicos
   * GET /academic-periods
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterAcademicPeriodDto,
  ) {
    return this.academicPeriodService.findAll(institutionId, filter);
  }

  /**
   * Obtener período activo
   * GET /academic-periods/active
   */
  @Get('active')
  async findActive(
    @TenantId() institutionId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.academicPeriodService.findActive(institutionId, academicYearId);
  }

  /**
   * Obtener período por ID
   * GET /academic-periods/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.academicPeriodService.findOne(institutionId, id);
  }

  /**
   * Actualizar período académico
   * PUT /academic-periods/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicPeriodDto,
  ) {
    return this.academicPeriodService.update(institutionId, id, dto);
  }

  /**
   * Eliminar período académico
   * DELETE /academic-periods/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.academicPeriodService.remove(institutionId, id);
  }
}
