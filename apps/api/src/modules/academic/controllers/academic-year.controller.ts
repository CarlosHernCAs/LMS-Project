/**
 * Controlador de Años Académicos
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

import { AcademicYearService } from '../services/academic-year.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  FilterAcademicYearDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('academic-years')
@RequireTenant()
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  /**
   * Crear año académico
   * POST /academic-years
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateAcademicYearDto,
  ) {
    return this.academicYearService.create(institutionId, dto);
  }

  /**
   * Listar años académicos
   * GET /academic-years
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterAcademicYearDto,
  ) {
    return this.academicYearService.findAll(institutionId, filter);
  }

  /**
   * Obtener año académico activo
   * GET /academic-years/active
   */
  @Get('active')
  async findActive(@TenantId() institutionId: string) {
    return this.academicYearService.findActive(institutionId);
  }

  /**
   * Obtener año académico por ID
   * GET /academic-years/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.academicYearService.findOne(institutionId, id);
  }

  /**
   * Actualizar año académico
   * PUT /academic-years/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYearService.update(institutionId, id, dto);
  }

  /**
   * Activar año académico
   * PATCH /academic-years/:id/activate
   */
  @Patch(':id/activate')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async activate(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.academicYearService.activate(institutionId, id);
  }

  /**
   * Eliminar año académico
   * DELETE /academic-years/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.academicYearService.remove(institutionId, id);
  }
}
