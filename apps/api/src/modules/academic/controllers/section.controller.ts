/**
 * Controlador de Secciones
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
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { SectionService } from '../services/section.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  FilterSectionDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('sections')
@RequireTenant()
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  /**
   * Crear sección
   * POST /sections
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionService.create(institutionId, dto);
  }

  /**
   * Crear múltiples secciones (A, B, C...)
   * POST /sections/bulk
   */
  @Post('bulk')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createBulk(
    @TenantId() institutionId: string,
    @Query('gradeId', ParseUUIDPipe) gradeId: string,
    @Query('academicYearId', ParseUUIDPipe) academicYearId: string,
    @Query('count', ParseIntPipe) count: number,
    @Query('maxCapacity') maxCapacity?: number,
  ) {
    return this.sectionService.createBulk(
      institutionId,
      gradeId,
      academicYearId,
      count,
      maxCapacity ? parseInt(maxCapacity as any) : 30,
    );
  }

  /**
   * Listar secciones
   * GET /sections
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterSectionDto,
  ) {
    return this.sectionService.findAll(institutionId, filter);
  }

  /**
   * Obtener sección por ID
   * GET /sections/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sectionService.findOne(institutionId, id);
  }

  /**
   * Obtener estudiantes de una sección
   * GET /sections/:id/students
   */
  @Get(':id/students')
  async getStudents(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sectionService.getStudents(institutionId, id);
  }

  /**
   * Actualizar sección
   * PUT /sections/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionService.update(institutionId, id, dto);
  }

  /**
   * Eliminar sección
   * DELETE /sections/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.sectionService.remove(institutionId, id);
  }
}
