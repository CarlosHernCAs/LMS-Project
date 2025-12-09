/**
 * Controlador de Competencias
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

import { CompetencyService } from '../services/competency.service';
import {
  CreateCompetencyDto,
  UpdateCompetencyDto,
  FilterCompetencyDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('competencies')
@RequireTenant()
export class CompetencyController {
  constructor(private readonly competencyService: CompetencyService) {}

  /**
   * Crear competencia
   * POST /competencies
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateCompetencyDto,
  ) {
    return this.competencyService.create(institutionId, dto);
  }

  /**
   * Crear competencias predeterminadas para Matemática
   * POST /competencies/defaults/math/:curriculumAreaId
   */
  @Post('defaults/math/:curriculumAreaId')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createDefaultsForMath(
    @TenantId() institutionId: string,
    @Param('curriculumAreaId', ParseUUIDPipe) curriculumAreaId: string,
  ) {
    return this.competencyService.createDefaultsForMath(
      institutionId,
      curriculumAreaId,
    );
  }

  /**
   * Crear competencias predeterminadas para Comunicación
   * POST /competencies/defaults/communication/:curriculumAreaId
   */
  @Post('defaults/communication/:curriculumAreaId')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createDefaultsForCommunication(
    @TenantId() institutionId: string,
    @Param('curriculumAreaId', ParseUUIDPipe) curriculumAreaId: string,
  ) {
    return this.competencyService.createDefaultsForCommunication(
      institutionId,
      curriculumAreaId,
    );
  }

  /**
   * Listar competencias
   * GET /competencies
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterCompetencyDto,
  ) {
    return this.competencyService.findAll(institutionId, filter);
  }

  /**
   * Obtener competencias por área curricular
   * GET /competencies/area/:curriculumAreaId
   */
  @Get('area/:curriculumAreaId')
  async findByArea(
    @TenantId() institutionId: string,
    @Param('curriculumAreaId', ParseUUIDPipe) curriculumAreaId: string,
  ) {
    return this.competencyService.findByArea(institutionId, curriculumAreaId);
  }

  /**
   * Obtener competencia por ID
   * GET /competencies/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.findOne(institutionId, id);
  }

  /**
   * Actualizar competencia
   * PUT /competencies/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetencyDto,
  ) {
    return this.competencyService.update(institutionId, id, dto);
  }

  /**
   * Eliminar competencia
   * DELETE /competencies/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.competencyService.remove(institutionId, id);
  }
}
