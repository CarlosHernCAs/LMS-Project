/**
 * Controlador de Áreas Curriculares
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

import { CurriculumAreaService } from '../services/curriculum-area.service';
import {
  CreateCurriculumAreaDto,
  UpdateCurriculumAreaDto,
  FilterCurriculumAreaDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('curriculum-areas')
@RequireTenant()
export class CurriculumAreaController {
  constructor(private readonly curriculumAreaService: CurriculumAreaService) {}

  /**
   * Crear área curricular
   * POST /curriculum-areas
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateCurriculumAreaDto,
  ) {
    return this.curriculumAreaService.create(institutionId, dto);
  }

  /**
   * Crear áreas predeterminadas según CNEB
   * POST /curriculum-areas/defaults
   */
  @Post('defaults')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createDefaults(@TenantId() institutionId: string) {
    return this.curriculumAreaService.createDefaults(institutionId);
  }

  /**
   * Listar áreas curriculares
   * GET /curriculum-areas
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterCurriculumAreaDto,
  ) {
    return this.curriculumAreaService.findAll(institutionId, filter);
  }

  /**
   * Obtener área curricular por ID
   * GET /curriculum-areas/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.curriculumAreaService.findOne(institutionId, id);
  }

  /**
   * Actualizar área curricular
   * PUT /curriculum-areas/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCurriculumAreaDto,
  ) {
    return this.curriculumAreaService.update(institutionId, id, dto);
  }

  /**
   * Eliminar área curricular
   * DELETE /curriculum-areas/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.curriculumAreaService.remove(institutionId, id);
  }
}
