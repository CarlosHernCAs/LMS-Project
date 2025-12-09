/**
 * Servicio de Usuarios
 *
 * Gestiona CRUD de usuarios, perfiles y relaciones padre-hijo.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUsersDto,
  StudentDataDto,
  LinkParentStudentDto,
  UserResponseDto,
  PaginatedUsersDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear nuevo usuario
   */
  async create(createDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, institutionId, ...userData } = createDto;

    // Verificar email único en la institución
    const existente = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        institutionId,
      },
    });

    if (existente) {
      throw new ConflictException('Ya existe un usuario con este email en la institución');
    }

    // Verificar DNI si se proporciona
    if (userData.dni) {
      const dniExistente = await this.prisma.user.findFirst({
        where: { dni: userData.dni, institutionId },
      });
      if (dniExistente) {
        throw new ConflictException('Ya existe un usuario con este DNI');
      }
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Crear usuario
    const usuario = await this.prisma.user.create({
      data: {
        ...userData,
        email: email.toLowerCase(),
        passwordHash,
        institutionId,
      },
    });

    // Si es estudiante, crear perfil de estudiante
    if (usuario.role === 'STUDENT') {
      await this.prisma.student.create({
        data: { userId: usuario.id },
      });
    }

    this.logger.log(`Usuario creado: ${usuario.email} (${usuario.role})`);

    return this.mapToResponse(usuario);
  }

  /**
   * Obtener usuarios con filtros y paginación
   */
  async findAll(
    institutionId: string,
    filters: FilterUsersDto,
  ): Promise<PaginatedUsersDto> {
    const { search, role, includeInactive, page = 1, limit = 20 } = filters;

    const where: any = { institutionId };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } },
      ];
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: usuarios.map((u) => this.mapToResponse(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener usuario por ID
   */
  async findById(id: string, institutionId?: string): Promise<UserResponseDto> {
    const where: any = { id };
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const usuario = await this.prisma.user.findFirst({ where });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.mapToResponse(usuario);
  }

  /**
   * Obtener usuario por email
   */
  async findByEmail(email: string, institutionId: string): Promise<UserResponseDto | null> {
    const usuario = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        institutionId,
      },
    });

    return usuario ? this.mapToResponse(usuario) : null;
  }

  /**
   * Actualizar usuario
   */
  async update(
    id: string,
    updateDto: UpdateUserDto,
    institutionId?: string,
  ): Promise<UserResponseDto> {
    const where: any = { id };
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const existente = await this.prisma.user.findFirst({ where });

    if (!existente) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se cambia email, verificar unicidad
    if (updateDto.email && updateDto.email !== existente.email) {
      const emailExistente = await this.prisma.user.findFirst({
        where: {
          email: updateDto.email.toLowerCase(),
          institutionId: existente.institutionId,
          id: { not: id },
        },
      });
      if (emailExistente) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Si se cambia DNI, verificar unicidad
    if (updateDto.dni && updateDto.dni !== existente.dni) {
      const dniExistente = await this.prisma.user.findFirst({
        where: {
          dni: updateDto.dni,
          institutionId: existente.institutionId,
          id: { not: id },
        },
      });
      if (dniExistente) {
        throw new ConflictException('El DNI ya está en uso');
      }
    }

    const usuario = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateDto,
        email: updateDto.email?.toLowerCase(),
      },
    });

    this.logger.log(`Usuario actualizado: ${usuario.email}`);

    return this.mapToResponse(usuario);
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleActive(id: string, isActive: boolean): Promise<UserResponseDto> {
    const usuario = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });

    this.logger.log(`Usuario ${isActive ? 'activado' : 'desactivado'}: ${usuario.email}`);

    return this.mapToResponse(usuario);
  }

  /**
   * Cambiar contraseña (admin)
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Invalidar todos los refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Contraseña reseteada para usuario: ${id}`);
  }

  /**
   * Actualizar datos de estudiante
   */
  async updateStudentData(userId: string, data: StudentDataDto): Promise<void> {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!usuario || usuario.role !== 'STUDENT') {
      throw new BadRequestException('El usuario no es un estudiante');
    }

    if (usuario.studentProfile) {
      await this.prisma.student.update({
        where: { userId },
        data,
      });
    } else {
      await this.prisma.student.create({
        data: { userId, ...data },
      });
    }
  }

  /**
   * Vincular padre con estudiante
   */
  async linkParentStudent(data: LinkParentStudentDto): Promise<void> {
    const { parentId, studentId, relationship, isPrimary } = data;

    // Verificar que el padre existe y tiene rol correcto
    const padre = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!padre || padre.role !== 'PARENT') {
      throw new BadRequestException('El usuario padre no existe o no tiene rol de apoderado');
    }

    // Verificar que el estudiante existe
    const estudiante = await this.prisma.student.findUnique({
      where: { userId: studentId },
    });
    if (!estudiante) {
      throw new BadRequestException('El estudiante no existe');
    }

    // Verificar que están en la misma institución
    const estudianteUser = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (padre.institutionId !== estudianteUser?.institutionId) {
      throw new BadRequestException('El padre y estudiante deben estar en la misma institución');
    }

    // Crear o actualizar vínculo
    await this.prisma.parentStudent.upsert({
      where: {
        parentId_studentId: { parentId, studentId: estudiante.id },
      },
      update: { relationship, isPrimary },
      create: {
        parentId,
        studentId: estudiante.id,
        relationship,
        isPrimary,
      },
    });

    this.logger.log(`Padre ${parentId} vinculado a estudiante ${studentId}`);
  }

  /**
   * Obtener hijos de un padre
   */
  async getChildren(parentId: string): Promise<UserResponseDto[]> {
    const relaciones = await this.prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    return relaciones.map((r) => this.mapToResponse(r.student.user));
  }

  /**
   * Obtener padres de un estudiante
   */
  async getParents(studentId: string): Promise<UserResponseDto[]> {
    const estudiante = await this.prisma.student.findUnique({
      where: { userId: studentId },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const relaciones = await this.prisma.parentStudent.findMany({
      where: { studentId: estudiante.id },
      include: { parent: true },
    });

    return relaciones.map((r) => this.mapToResponse(r.parent));
  }

  /**
   * Importar usuarios masivamente
   */
  async bulkImport(
    users: CreateUserDto[],
    institutionId: string,
  ): Promise<{ created: number; errors: Array<{ email: string; error: string }> }> {
    const errores: Array<{ email: string; error: string }> = [];
    let creados = 0;

    for (const userData of users) {
      try {
        // Asegurar que todos pertenecen a la misma institución
        await this.create({ ...userData, institutionId });
        creados++;
      } catch (error) {
        errores.push({
          email: userData.email,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    this.logger.log(`Importación masiva: ${creados} creados, ${errores.length} errores`);

    return { created: creados, errors: errores };
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async remove(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidar tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Usuario eliminado (desactivado): ${id}`);
  }

  /**
   * Mapear entidad a respuesta
   */
  private mapToResponse(usuario: any): UserResponseDto {
    return {
      id: usuario.id,
      email: usuario.email,
      firstName: usuario.firstName,
      lastName: usuario.lastName,
      dni: usuario.dni,
      phone: usuario.phone,
      avatar: usuario.avatar,
      role: usuario.role,
      institutionId: usuario.institutionId,
      isActive: usuario.isActive,
      emailVerified: usuario.emailVerified,
      lastLoginAt: usuario.lastLoginAt,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
  }
}
