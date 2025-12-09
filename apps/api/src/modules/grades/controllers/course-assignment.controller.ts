/**
 * Controlador de Asignación de Cursos
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

import { CourseAssignmentService } from '../services/course-assignment.service';
import {
  CreateCourseAssignmentDto,
  BulkCourseAssignmentDto,
  UpdateCourseAssignmentDto,
  FilterCourseAssignmentDto,
} from '../dto';
import { TenantId, RequireTenant } from '../../tenants';
import { Roles } from '../../rbac';
import { CurrentUser } from '../../auth';
import { Role } from '@prisma/client';

@Controller('course-assignments')
@RequireTenant()
export class CourseAssignmentController {
  constructor(
    private readonly courseAssignmentService: CourseAssignmentService,
  ) {}

  /**
   * Crear asignación de curso
   * POST /course-assignments
   */
  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async create(
    @TenantId() institutionId: string,
    @Body() dto: CreateCourseAssignmentDto,
  ) {
    return this.courseAssignmentService.create(institutionId, dto);
  }

  /**
   * Asignación masiva de cursos
   * POST /course-assignments/bulk
   */
  @Post('bulk')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async createBulk(
    @TenantId() institutionId: string,
    @Body() dto: BulkCourseAssignmentDto,
  ) {
    return this.courseAssignmentService.createBulk(institutionId, dto);
  }

  /**
   * Listar asignaciones de cursos
   * GET /course-assignments
   */
  @Get()
  async findAll(
    @TenantId() institutionId: string,
    @Query() filter: FilterCourseAssignmentDto,
  ) {
    return this.courseAssignmentService.findAll(institutionId, filter);
  }

  /**
   * Obtener mis asignaciones (para profesores)
   * GET /course-assignments/my-courses
   */
  @Get('my-courses')
  @Roles(Role.TEACHER)
  async findMyCourses(
    @TenantId() institutionId: string,
    @CurrentUser('id') teacherId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.courseAssignmentService.findByTeacher(
      institutionId,
      teacherId,
      academicYearId,
    );
  }

  /**
   * Obtener carga académica de un profesor
   * GET /course-assignments/workload/:teacherId
   */
  @Get('workload/:teacherId')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async getTeacherWorkload(
    @TenantId() institutionId: string,
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Query('academicYearId', ParseUUIDPipe) academicYearId: string,
  ) {
    return this.courseAssignmentService.getTeacherWorkload(
      institutionId,
      teacherId,
      academicYearId,
    );
  }

  /**
   * Obtener asignaciones de un profesor
   * GET /course-assignments/teacher/:teacherId
   */
  @Get('teacher/:teacherId')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async findByTeacher(
    @TenantId() institutionId: string,
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.courseAssignmentService.findByTeacher(
      institutionId,
      teacherId,
      academicYearId,
    );
  }

  /**
   * Obtener asignación por ID
   * GET /course-assignments/:id
   */
  @Get(':id')
  async findOne(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courseAssignmentService.findOne(institutionId, id);
  }

  /**
   * Actualizar asignación de curso
   * PUT /course-assignments/:id
   */
  @Put(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_COORDINATOR)
  async update(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseAssignmentDto,
  ) {
    return this.courseAssignmentService.update(institutionId, id, dto);
  }

  /**
   * Eliminar asignación de curso
   * DELETE /course-assignments/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.INSTITUTION_ADMIN)
  async remove(
    @TenantId() institutionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.courseAssignmentService.remove(institutionId, id);
  }
}
