/**
 * Controlador de Grados Académicos
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

import { GradeService } from '../services/grade.service';
import {
  CreateGradeDto,
  UpdateGradeDto,
  FilterGradeDto,
  EducationLevel,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { Role } from '@prisma/client';

@Controller('grades')
@RequireTenant()
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  /**
   * Crear grado
   * POST /grades
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateGradeDto,
  ) {
    return this.gradeService.create(institutionId, dto);
  }

  /**
   * Crear grados predeterminados para un nivel
   * POST /grades/defaults/:level
   */
  @Post('defaults/:level')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createDefaults(
    @TenantId() institutionId: string,
    @Param('level') level: EducationLevel,
  ) {
    return this.gradeService.createDefaults(institutionId, level);
  }

  /**
   * Listar grados
   * GET /grades
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterGradeDto,
  ) {
    return this.gradeService.findAll(institutionId, filter);
  }

  /**
   * Obtener grado por ID
   * GET /grades/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gradeService.findOne(institutionId, id);
  }

  /**
   * Actualizar grado
   * PUT /grades/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradeService.update(institutionId, id, dto);
  }

  /**
   * Eliminar grado
   * DELETE /grades/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.gradeService.remove(institutionId, id);
  }
}
