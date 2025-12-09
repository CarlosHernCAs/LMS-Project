/**
 * Controlador de Usuarios
 *
 * Endpoints para gestión de usuarios del sistema.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUsersDto,
  StudentDataDto,
  LinkParentStudentDto,
  BulkImportUserDto,
  UserResponseDto,
  PaginatedUsersDto,
} from './dto/user.dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../auth';
import { RequireTenant, TenantId } from '../tenants';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crear nuevo usuario
   */
  @Post()
  @RequireTenant()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(
    @Body() createDto: CreateUserDto,
    @TenantId() tenantId: string,
  ): Promise<UserResponseDto> {
    // Forzar la institución del tenant actual
    return this.usersService.create({ ...createDto, institutionId: tenantId });
  }

  /**
   * Listar usuarios con filtros
   */
  @Get()
  @RequireTenant()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, type: PaginatedUsersDto })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: FilterUsersDto,
  ): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(tenantId, filters);
  }

  /**
   * Obtener mi perfil
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.findById(user.id);
  }

  /**
   * Actualizar mi perfil
   */
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Usuarios solo pueden actualizar ciertos campos de su perfil
    const { firstName, lastName, phone, avatar } = updateDto;
    return this.usersService.update(user.id, { firstName, lastName, phone, avatar });
  }

  /**
   * Obtener usuario por ID
   */
  @Get(':id')
  @RequireTenant()
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id, tenantId);
  }

  /**
   * Actualizar usuario
   */
  @Patch(':id')
  @RequireTenant()
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
    @TenantId() tenantId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateDto, tenantId);
  }

  /**
   * Activar usuario
   */
  @Patch(':id/activate')
  @RequireTenant()
  @ApiOperation({ summary: 'Activar usuario' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.toggleActive(id, true);
  }

  /**
   * Desactivar usuario
   */
  @Patch(':id/deactivate')
  @RequireTenant()
  @ApiOperation({ summary: 'Desactivar usuario' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.toggleActive(id, false);
  }

  /**
   * Resetear contraseña (admin)
   */
  @Post(':id/reset-password')
  @RequireTenant()
  @ApiOperation({ summary: 'Resetear contraseña' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { newPassword: string },
  ): Promise<{ message: string }> {
    await this.usersService.resetPassword(id, body.newPassword);
    return { message: 'Contraseña restablecida exitosamente' };
  }

  /**
   * Actualizar datos de estudiante
   */
  @Patch(':id/student-data')
  @RequireTenant()
  @ApiOperation({ summary: 'Actualizar datos de estudiante' })
  async updateStudentData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: StudentDataDto,
  ): Promise<{ message: string }> {
    await this.usersService.updateStudentData(id, data);
    return { message: 'Datos de estudiante actualizados' };
  }

  /**
   * Vincular padre con estudiante
   */
  @Post('link-parent-student')
  @RequireTenant()
  @ApiOperation({ summary: 'Vincular padre con estudiante' })
  async linkParentStudent(@Body() data: LinkParentStudentDto): Promise<{ message: string }> {
    await this.usersService.linkParentStudent(data);
    return { message: 'Vínculo creado exitosamente' };
  }

  /**
   * Obtener hijos de un padre
   */
  @Get(':id/children')
  @RequireTenant()
  @ApiOperation({ summary: 'Obtener hijos de un padre' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async getChildren(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto[]> {
    return this.usersService.getChildren(id);
  }

  /**
   * Obtener padres de un estudiante
   */
  @Get(':id/parents')
  @RequireTenant()
  @ApiOperation({ summary: 'Obtener padres de un estudiante' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async getParents(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto[]> {
    return this.usersService.getParents(id);
  }

  /**
   * Importar usuarios masivamente
   */
  @Post('bulk-import')
  @RequireTenant()
  @ApiOperation({ summary: 'Importar usuarios masivamente' })
  async bulkImport(
    @Body() data: BulkImportUserDto,
    @TenantId() tenantId: string,
  ): Promise<{ created: number; errors: Array<{ email: string; error: string }> }> {
    return this.usersService.bulkImport(data.users, tenantId);
  }

  /**
   * Eliminar usuario
   */
  @Delete(':id')
  @RequireTenant()
  @ApiOperation({ summary: 'Eliminar usuario' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado exitosamente' };
  }
}
