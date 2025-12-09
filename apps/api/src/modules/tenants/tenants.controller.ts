/**
 * Controlador de Instituciones (Tenants)
 *
 * Endpoints para gestión de instituciones educativas.
 * La mayoría requiere rol SUPER_ADMIN.
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
  ApiQuery,
} from '@nestjs/swagger';

import { TenantsService } from './tenants.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionSettingsDto,
  InstitutionResponseDto,
} from './dto/tenant.dto';
import { JwtAuthGuard, Public } from '../auth';

@ApiTags('institutions')
@Controller('institutions')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Crear nueva institución
   * Solo SUPER_ADMIN
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear institución' })
  @ApiResponse({ status: 201, type: InstitutionResponseDto })
  async create(@Body() createDto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    return this.tenantsService.create(createDto);
  }

  /**
   * Listar todas las instituciones
   * Público (para mostrar en login)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar instituciones' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [InstitutionResponseDto] })
  async findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<InstitutionResponseDto[]> {
    return this.tenantsService.findAll({
      search,
      type,
      includeInactive: includeInactive === true,
    });
  }

  /**
   * Obtener institución por ID
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener institución por ID' })
  @ApiResponse({ status: 200, type: InstitutionResponseDto })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<InstitutionResponseDto> {
    return this.tenantsService.findById(id);
  }

  /**
   * Obtener institución por slug
   * Público (para resolución de tenant)
   */
  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obtener institución por slug' })
  @ApiResponse({ status: 200, type: InstitutionResponseDto })
  async findBySlug(@Param('slug') slug: string): Promise<InstitutionResponseDto | null> {
    return this.tenantsService.findBySlug(slug);
  }

  /**
   * Actualizar institución
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar institución' })
  @ApiResponse({ status: 200, type: InstitutionResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    return this.tenantsService.update(id, updateDto);
  }

  /**
   * Actualizar configuración de institución
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuración de institución' })
  @ApiResponse({ status: 200, type: InstitutionResponseDto })
  async updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() settingsDto: InstitutionSettingsDto,
  ): Promise<InstitutionResponseDto> {
    return this.tenantsService.updateSettings(id, settingsDto);
  }

  /**
   * Obtener estadísticas de institución
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de institución' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getStats(id);
  }

  /**
   * Activar institución
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar institución' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<InstitutionResponseDto> {
    return this.tenantsService.toggleActive(id, true);
  }

  /**
   * Desactivar institución
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar institución' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<InstitutionResponseDto> {
    return this.tenantsService.toggleActive(id, false);
  }

  /**
   * Eliminar institución (soft delete)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar institución' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.tenantsService.remove(id);
    return { message: 'Institución eliminada exitosamente' };
  }
}
