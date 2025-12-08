/**
 * @lms/shared-types
 *
 * Tipos compartidos entre el backend (NestJS) y frontend (Next.js)
 */

// ============================================
// Enums
// ============================================

export enum Role {
  SUPER_ADMIN = 'super_admin',
  INSTITUTION_ADMIN = 'institution_admin',
  ACADEMIC_COORDINATOR = 'academic_coordinator',
  TEACHER = 'teacher',
  TUTOR = 'tutor',
  STUDENT = 'student',
  PARENT = 'parent',
  AUXILIARY = 'auxiliary',
}

export enum InstitutionType {
  INICIAL = 'inicial',
  PRIMARIA = 'primaria',
  SECUNDARIA = 'secundaria',
  PRIMARIA_SECUNDARIA = 'primaria_secundaria',
  COMPLETO = 'completo', // Inicial + Primaria + Secundaria
}

export enum PeriodType {
  BIMESTRAL = 'bimestral',
  TRIMESTRAL = 'trimestral',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  TRANSFERRED = 'transferred',
  WITHDRAWN = 'withdrawn',
  GRADUATED = 'graduated',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  JUSTIFIED = 'justified',
}

export enum GradeScale {
  AD = 'AD', // Logro destacado
  A = 'A', // Logro esperado
  B = 'B', // En proceso
  C = 'C', // En inicio
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserBasic;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ============================================
// User Types
// ============================================

export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
  institutionId: string;
}

export interface User extends UserBasic {
  dni?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  dni?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

// ============================================
// Institution Types
// ============================================

export interface Institution {
  id: string;
  code: string;
  name: string;
  slug: string;
  type: InstitutionType;
  ugel?: string;
  dre?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionSettings {
  periodType: PeriodType;
  gradeScale: 'literal' | 'numeric' | 'both';
  allowParentAccess: boolean;
  requireMfa: boolean;
  theme?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}

// ============================================
// Academic Types
// ============================================

export interface AcademicYear {
  id: string;
  institutionId: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  periodType: PeriodType;
  isActive: boolean;
  isClosed: boolean;
}

export interface AcademicPeriod {
  id: string;
  academicYearId: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  isClosed: boolean;
}

export interface Grade {
  id: string;
  institutionId: string;
  level: 'inicial' | 'primaria' | 'secundaria';
  name: string;
  orderNum: number;
}

export interface Section {
  id: string;
  gradeId: string;
  academicYearId: string;
  name: string;
  tutorId?: string;
  capacity: number;
}

// ============================================
// Enrollment Types
// ============================================

export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  academicYearId: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  observations?: string;
}

// ============================================
// Curriculum Types
// ============================================

export interface CurriculumArea {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  level: 'inicial' | 'primaria' | 'secundaria';
  hoursPerWeek: number;
  isMandatory: boolean;
}

export interface Competency {
  id: string;
  areaId: string;
  code: string;
  name: string;
  description?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

// ============================================
// Permission Types
// ============================================

export type Permission =
  // Users
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'users:manage'
  // Institutions
  | 'institutions:create'
  | 'institutions:read'
  | 'institutions:update'
  | 'institutions:delete'
  // Academic
  | 'academic:manage'
  | 'academic:read'
  // Grades (calificaciones)
  | 'grades:create'
  | 'grades:read'
  | 'grades:update'
  | 'grades:approve'
  // Attendance
  | 'attendance:mark'
  | 'attendance:read'
  | 'attendance:report'
  // Content
  | 'content:create'
  | 'content:read'
  | 'content:update'
  | 'content:delete'
  // Reports
  | 'reports:generate'
  | 'reports:export'
  // Settings
  | 'settings:manage'
  | 'settings:read';

export type PermissionScope = 'own' | 'section' | 'grade' | 'institution' | 'global';
