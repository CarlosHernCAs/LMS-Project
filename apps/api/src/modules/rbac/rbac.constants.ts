/**
 * Constantes del Sistema RBAC
 *
 * Define los permisos y roles del sistema.
 */

import { Role } from '@prisma/client';

/**
 * Permisos del sistema agrupados por módulo
 */
export const PERMISSIONS = {
  // Usuarios
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage', // Todos los permisos de usuarios

  // Instituciones
  INSTITUTIONS_CREATE: 'institutions:create',
  INSTITUTIONS_READ: 'institutions:read',
  INSTITUTIONS_UPDATE: 'institutions:update',
  INSTITUTIONS_DELETE: 'institutions:delete',

  // Académico
  ACADEMIC_MANAGE: 'academic:manage',
  ACADEMIC_READ: 'academic:read',

  // Calificaciones
  GRADES_CREATE: 'grades:create',
  GRADES_READ: 'grades:read',
  GRADES_UPDATE: 'grades:update',
  GRADES_APPROVE: 'grades:approve',
  GRADES_READ_OWN: 'grades:read:own', // Solo las propias

  // Asistencia
  ATTENDANCE_CREATE: 'attendance:create',
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_UPDATE: 'attendance:update',
  ATTENDANCE_DELETE: 'attendance:delete',
  ATTENDANCE_MARK: 'attendance:mark', // Alias para CREATE
  ATTENDANCE_REPORT: 'attendance:report',

  // Contenido
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',

  // Reportes
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_EXPORT: 'reports:export',

  // Configuración
  SETTINGS_MANAGE: 'settings:manage',
  SETTINGS_READ: 'settings:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Scopes de permisos
 */
export const SCOPES = {
  OWN: 'own', // Solo sus propios datos
  SECTION: 'section', // Datos de su sección
  GRADE: 'grade', // Datos de su grado
  INSTITUTION: 'institution', // Toda la institución
  GLOBAL: 'global', // Todo el sistema (super admin)
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

/**
 * Permisos por defecto para cada rol
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS), // Todos los permisos

  INSTITUTION_ADMIN: [
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.INSTITUTIONS_READ,
    PERMISSIONS.INSTITUTIONS_UPDATE,
    PERMISSIONS.ACADEMIC_MANAGE,
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.GRADES_APPROVE,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.ATTENDANCE_DELETE,
    PERMISSIONS.ATTENDANCE_REPORT,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_MANAGE,
  ],

  ACADEMIC_COORDINATOR: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ACADEMIC_MANAGE,
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.GRADES_APPROVE,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.ATTENDANCE_REPORT,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.SETTINGS_READ,
  ],

  TEACHER: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ACADEMIC_READ,
    PERMISSIONS.GRADES_CREATE,
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.GRADES_UPDATE,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.REPORTS_GENERATE,
  ],

  TUTOR: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ACADEMIC_READ,
    PERMISSIONS.GRADES_READ,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.ATTENDANCE_REPORT,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.REPORTS_GENERATE,
  ],

  STUDENT: [
    PERMISSIONS.GRADES_READ_OWN,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.CONTENT_READ,
  ],

  PARENT: [
    PERMISSIONS.GRADES_READ_OWN, // Notas de sus hijos
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.CONTENT_READ,
  ],

  AUXILIARY: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
  ],

  SECRETARY: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.ACADEMIC_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.REPORTS_GENERATE,
  ],
};

// Agregar permiso faltante para INSTITUTION_ADMIN
DEFAULT_ROLE_PERMISSIONS.INSTITUTION_ADMIN.push(PERMISSIONS.CONTENT_CREATE);
DEFAULT_ROLE_PERMISSIONS.INSTITUTION_ADMIN.push(PERMISSIONS.CONTENT_UPDATE);
DEFAULT_ROLE_PERMISSIONS.INSTITUTION_ADMIN.push(PERMISSIONS.CONTENT_DELETE);

/**
 * Roles jerárquicos (mayor número = más privilegios)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  INSTITUTION_ADMIN: 90,
  ACADEMIC_COORDINATOR: 80,
  SECRETARY: 70,
  TEACHER: 60,
  TUTOR: 50,
  AUXILIARY: 40,
  PARENT: 20,
  STUDENT: 10,
};

/**
 * Verifica si un rol puede gestionar otro rol
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}
