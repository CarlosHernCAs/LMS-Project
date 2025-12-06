# TASKLIST - LMS PERÚ
## Lista de Tareas Detallada por Fase

---

## FASE 0: PREPARACIÓN (Semanas 1-2)

### 0.1 Configuración del Monorepo
- [ ] **0.1.1** Inicializar Turborepo con pnpm
- [ ] **0.1.2** Crear estructura de workspaces:
  ```
  apps/
    api/          # NestJS Backend
    web/          # Next.js Frontend
  packages/
    shared-types/ # DTOs, interfaces compartidas
    ui/           # Componentes React compartidos
    config/       # Configuraciones compartidas (eslint, tsconfig)
  ```
- [ ] **0.1.3** Configurar scripts de monorepo (build, dev, test, lint)
- [ ] **0.1.4** Configurar path aliases (@api/*, @web/*, @shared/*)

### 0.2 Setup Backend (NestJS)
- [ ] **0.2.1** Crear proyecto NestJS con CLI
- [ ] **0.2.2** Configurar estructura de módulos:
  ```
  src/
    common/         # Shared utilities
      decorators/
      filters/
      guards/
      interceptors/
      pipes/
    config/         # Configuration module
    database/       # Database module
    modules/        # Feature modules
  ```
- [ ] **0.2.3** Configurar ConfigModule con validación de env
- [ ] **0.2.4** Configurar logging (Winston o Pino)
- [ ] **0.2.5** Configurar Swagger/OpenAPI
- [ ] **0.2.6** Configurar CORS y Helmet
- [ ] **0.2.7** Integrar sistema de resiliencia (ya creado)

### 0.3 Setup Base de Datos
- [ ] **0.3.1** Configurar Prisma ORM
- [ ] **0.3.2** Crear schema base con multi-tenant
- [ ] **0.3.3** Configurar conexión a PostgreSQL
- [ ] **0.3.4** Crear migration inicial
- [ ] **0.3.5** Configurar seeds para desarrollo
- [ ] **0.3.6** Implementar Row Level Security (RLS)

### 0.4 Setup Frontend (Next.js)
- [ ] **0.4.1** Crear proyecto Next.js 14 (App Router)
- [ ] **0.4.2** Configurar TailwindCSS
- [ ] **0.4.3** Instalar y configurar Shadcn/ui
- [ ] **0.4.4** Configurar React Query
- [ ] **0.4.5** Configurar Zustand para estado global
- [ ] **0.4.6** Crear layout base y temas
- [ ] **0.4.7** Configurar API client (axios/fetch wrapper)

### 0.5 Docker y Entorno Local
- [ ] **0.5.1** Crear Dockerfile.api (multi-stage build)
- [ ] **0.5.2** Crear Dockerfile.web
- [ ] **0.5.3** Crear docker-compose.yml:
  ```yaml
  services:
    postgres:    # PostgreSQL 16
    redis:       # Redis 7
    api:         # NestJS (dev mode)
    web:         # Next.js (dev mode)
  ```
- [ ] **0.5.4** Crear docker-compose.prod.yml
- [ ] **0.5.5** Configurar volúmenes para persistencia
- [ ] **0.5.6** Crear scripts de inicialización

### 0.6 CI/CD Básico
- [ ] **0.6.1** Crear workflow de GitHub Actions:
  - Lint
  - Build
  - Test unitarios
  - Test e2e (opcional)
- [ ] **0.6.2** Configurar cache de dependencias
- [ ] **0.6.3** Configurar branch protection rules
- [ ] **0.6.4** Crear template de PR

### 0.7 Documentación Inicial
- [ ] **0.7.1** Crear README.md principal
- [ ] **0.7.2** Crear CONTRIBUTING.md
- [ ] **0.7.3** Crear estructura de ADRs (Architecture Decision Records)
- [ ] **0.7.4** Documentar convenciones de código
- [ ] **0.7.5** Crear guía de instalación local

---

## FASE 1: NÚCLEO DEL SISTEMA (Meses 1-4)

### 1.1 Auth Module (Semanas 3-4)

#### 1.1.1 Modelo de Datos Auth
- [ ] Crear tabla `users` (base)
- [ ] Crear tabla `refresh_tokens`
- [ ] Crear tabla `password_resets`
- [ ] Crear tabla `sessions`
- [ ] Crear tabla `login_attempts` (seguridad)

#### 1.1.2 Registro de Usuarios
- [ ] Endpoint POST /auth/register
- [ ] Validación de datos (class-validator)
- [ ] Hash de contraseña (bcrypt)
- [ ] Envío de email de verificación
- [ ] Endpoint GET /auth/verify-email/:token

#### 1.1.3 Login/Logout
- [ ] Endpoint POST /auth/login
- [ ] Generación de JWT (access + refresh)
- [ ] Estrategia Passport JWT
- [ ] Endpoint POST /auth/refresh
- [ ] Endpoint POST /auth/logout
- [ ] Invalidación de refresh tokens

#### 1.1.4 Recuperación de Contraseña
- [ ] Endpoint POST /auth/forgot-password
- [ ] Generación de token temporal
- [ ] Envío de email con link
- [ ] Endpoint POST /auth/reset-password
- [ ] Validación de token y expiración

#### 1.1.5 Seguridad Adicional
- [ ] Rate limiting por IP y usuario
- [ ] Bloqueo por intentos fallidos
- [ ] Logging de actividad
- [ ] Guard de autenticación global
- [ ] Middleware de sesión

#### 1.1.6 Tests Auth Module
- [ ] Tests unitarios AuthService
- [ ] Tests unitarios JwtStrategy
- [ ] Tests e2e flujo de registro
- [ ] Tests e2e flujo de login
- [ ] Tests e2e refresh token

### 1.2 Tenant Module (Semanas 5-6)

#### 1.2.1 Modelo de Datos Tenant
- [ ] Crear tabla `institutions`:
  ```prisma
  model Institution {
    id            String   @id @default(uuid())
    code          String   @unique  // Código modular
    name          String
    slug          String   @unique  // Para subdomain
    type          InstitutionType
    ugel          String?
    dre           String?
    address       String?
    phone         String?
    email         String?
    logo          String?
    settings      Json     @default("{}")
    isActive      Boolean  @default(true)
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
  }
  ```
- [ ] Crear enum `InstitutionType` (INICIAL, PRIMARIA, SECUNDARIA, etc.)
- [ ] Crear tabla `institution_settings`

#### 1.2.2 Resolución de Tenant
- [ ] Middleware de resolución por subdomain
- [ ] Middleware de resolución por header (X-Tenant-Id)
- [ ] Inyección de tenant en request
- [ ] Decorador @CurrentTenant()
- [ ] Guard de tenant válido

#### 1.2.3 Row Level Security
- [ ] Configurar políticas RLS en PostgreSQL
- [ ] Crear función set_tenant_id()
- [ ] Interceptor para setear tenant en conexión
- [ ] Tests de aislamiento de datos

#### 1.2.4 CRUD Instituciones
- [ ] Endpoint POST /institutions (super admin)
- [ ] Endpoint GET /institutions
- [ ] Endpoint GET /institutions/:id
- [ ] Endpoint PATCH /institutions/:id
- [ ] Endpoint DELETE /institutions/:id (soft delete)

#### 1.2.5 Configuración por Institución
- [ ] Endpoint GET /institutions/:id/settings
- [ ] Endpoint PATCH /institutions/:id/settings
- [ ] Tipos de configuración:
  - Períodos académicos (bimestral/trimestral)
  - Escala de calificación
  - Horarios
  - Notificaciones
  - Personalización UI

### 1.3 User Module (Semanas 7-8)

#### 1.3.1 Modelo de Datos Usuarios
- [ ] Extender tabla `users`:
  ```prisma
  model User {
    id              String   @id @default(uuid())
    institutionId   String
    dni             String?
    email           String
    passwordHash    String
    firstName       String
    lastName        String
    phone           String?
    avatar          String?
    role            Role
    isActive        Boolean  @default(true)
    emailVerified   Boolean  @default(false)
    mfaEnabled      Boolean  @default(false)
    lastLoginAt     DateTime?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt

    institution     Institution @relation(...)
  }
  ```
- [ ] Crear tabla `user_profiles` (datos adicionales por rol)
- [ ] Crear tabla `students` (extensión para alumnos)
- [ ] Crear tabla `teachers` (extensión para docentes)
- [ ] Crear tabla `parents` (extensión para padres)
- [ ] Crear tabla `parent_student` (relación padre-hijo)

#### 1.3.2 CRUD Usuarios
- [ ] Endpoint POST /users
- [ ] Endpoint GET /users (con filtros y paginación)
- [ ] Endpoint GET /users/:id
- [ ] Endpoint PATCH /users/:id
- [ ] Endpoint DELETE /users/:id (soft delete)
- [ ] Endpoint POST /users/bulk (importación masiva)

#### 1.3.3 Gestión de Perfil
- [ ] Endpoint GET /users/me
- [ ] Endpoint PATCH /users/me
- [ ] Endpoint POST /users/me/avatar
- [ ] Endpoint PATCH /users/me/password
- [ ] Endpoint POST /users/me/mfa/enable
- [ ] Endpoint POST /users/me/mfa/disable

#### 1.3.4 Relaciones Padre-Hijo
- [ ] Endpoint POST /users/:parentId/children
- [ ] Endpoint GET /users/:parentId/children
- [ ] Endpoint DELETE /users/:parentId/children/:studentId
- [ ] Validación de pertenencia a misma institución

#### 1.3.5 Importación de Usuarios
- [ ] Parser de Excel (xlsx)
- [ ] Validación de datos
- [ ] Creación batch
- [ ] Reporte de errores
- [ ] Endpoint POST /users/import

### 1.4 RBAC Module (Semanas 9-10)

#### 1.4.1 Modelo de Datos RBAC
- [ ] Crear tabla `roles`:
  ```prisma
  model Role {
    id              String   @id @default(uuid())
    name            String
    slug            String
    description     String?
    isSystem        Boolean  @default(false)
    institutionId   String?  // null = global
    permissions     RolePermission[]
  }
  ```
- [ ] Crear tabla `permissions`
- [ ] Crear tabla `role_permissions`
- [ ] Crear tabla `user_roles`

#### 1.4.2 Permisos del Sistema
- [ ] Definir permisos base:
  ```typescript
  // Usuarios
  'users:create', 'users:read', 'users:update', 'users:delete'

  // Académico
  'academic:manage', 'academic:read'

  // Calificaciones
  'grades:create', 'grades:read', 'grades:update', 'grades:approve'

  // Asistencia
  'attendance:mark', 'attendance:read', 'attendance:report'

  // Contenido
  'content:create', 'content:read', 'content:update', 'content:delete'

  // Reportes
  'reports:generate', 'reports:export'

  // Configuración
  'settings:manage'
  ```
- [ ] Crear seed de roles por defecto
- [ ] Crear seed de permisos

#### 1.4.3 Guards y Decoradores
- [ ] Crear @Roles(...roles) decorator
- [ ] Crear @Permissions(...permissions) decorator
- [ ] Crear @Public() decorator
- [ ] Crear RolesGuard
- [ ] Crear PermissionsGuard
- [ ] Integrar con Auth

#### 1.4.4 Scopes de Permisos
- [ ] Implementar scope 'own' (solo sus datos)
- [ ] Implementar scope 'section' (su sección)
- [ ] Implementar scope 'grade' (su grado)
- [ ] Implementar scope 'institution' (toda la institución)
- [ ] Crear @Scope() decorator

#### 1.4.5 CRUD Roles (Admin)
- [ ] Endpoint POST /roles
- [ ] Endpoint GET /roles
- [ ] Endpoint GET /roles/:id
- [ ] Endpoint PATCH /roles/:id
- [ ] Endpoint DELETE /roles/:id
- [ ] Endpoint POST /roles/:id/permissions
- [ ] Endpoint DELETE /roles/:id/permissions/:permissionId

### 1.5 Academic Module Base (Semanas 11-14)

#### 1.5.1 Modelo de Datos Académico
- [ ] Crear tabla `academic_years`:
  ```prisma
  model AcademicYear {
    id              String   @id @default(uuid())
    institutionId   String
    year            Int
    name            String   // "2025"
    startDate       DateTime
    endDate         DateTime
    periodType      PeriodType // BIMESTRAL, TRIMESTRAL
    isActive        Boolean  @default(false)
    isClosed        Boolean  @default(false)
  }
  ```
- [ ] Crear tabla `academic_periods`
- [ ] Crear tabla `levels` (inicial, primaria, secundaria)
- [ ] Crear tabla `grades` (1°, 2°, etc.)
- [ ] Crear tabla `sections` (A, B, C)

#### 1.5.2 CRUD Año Escolar
- [ ] Endpoint POST /academic-years
- [ ] Endpoint GET /academic-years
- [ ] Endpoint GET /academic-years/:id
- [ ] Endpoint PATCH /academic-years/:id
- [ ] Endpoint POST /academic-years/:id/activate
- [ ] Endpoint POST /academic-years/:id/close

#### 1.5.3 CRUD Períodos
- [ ] Endpoint POST /academic-years/:yearId/periods
- [ ] Endpoint GET /academic-years/:yearId/periods
- [ ] Endpoint PATCH /periods/:id
- [ ] Endpoint POST /periods/:id/close

#### 1.5.4 CRUD Grados y Secciones
- [ ] Endpoint CRUD /grades
- [ ] Endpoint CRUD /sections
- [ ] Endpoint GET /grades/:id/sections
- [ ] Asignación de tutor a sección

#### 1.5.5 Matrícula
- [ ] Crear tabla `enrollments`:
  ```prisma
  model Enrollment {
    id              String   @id @default(uuid())
    studentId       String
    sectionId       String
    academicYearId  String
    enrollmentDate  DateTime
    status          EnrollmentStatus
    previousSchool  String?
    observations    String?
  }
  ```
- [ ] Endpoint POST /enrollments
- [ ] Endpoint GET /enrollments
- [ ] Endpoint GET /students/:id/enrollments
- [ ] Endpoint POST /enrollments/bulk
- [ ] Proceso de traslado

### 1.6 Curriculum Module (Semanas 15-16)

#### 1.6.1 Modelo de Datos Currículo
- [ ] Crear tabla `curriculum_areas`:
  ```prisma
  model CurriculumArea {
    id              String   @id @default(uuid())
    institutionId   String
    code            String   // MAT, COM, CYT
    name            String
    level           Level
    hoursPerWeek    Int
    isMandatory     Boolean  @default(true)
    competencies    Competency[]
  }
  ```
- [ ] Crear tabla `competencies`
- [ ] Crear tabla `learning_standards`
- [ ] Crear tabla `performances`

#### 1.6.2 Catálogo CNEB
- [ ] Seed de áreas curriculares oficiales
- [ ] Seed de competencias por área
- [ ] Seed de estándares de aprendizaje
- [ ] Seed de desempeños por grado
- [ ] Permitir personalización por institución

#### 1.6.3 Asignación de Cursos
- [ ] Crear tabla `course_assignments`:
  ```prisma
  model CourseAssignment {
    id              String   @id @default(uuid())
    teacherId       String
    sectionId       String
    areaId          String
    academicYearId  String
  }
  ```
- [ ] Endpoint POST /course-assignments
- [ ] Endpoint GET /teachers/:id/courses
- [ ] Endpoint GET /sections/:id/courses
- [ ] Validaciones de conflictos

#### 1.6.4 Horarios (Básico)
- [ ] Crear tabla `schedules`
- [ ] Crear tabla `schedule_slots`
- [ ] Endpoint CRUD horarios
- [ ] Validación de conflictos

---

## FASE 2: PREVIEW (Para planificación futura)

### 2.1 Grades Module
- [ ] Registro de notas por competencia
- [ ] Cálculo de promedios
- [ ] Actas y boletas
- [ ] Historial académico

### 2.2 Attendance Module
- [ ] Registro diario
- [ ] Justificaciones
- [ ] Reportes
- [ ] Alertas

### 2.3 Messaging Module
- [ ] Mensajes internos
- [ ] Anuncios
- [ ] Notificaciones
- [ ] Calendario

---

## PRIORIDADES INMEDIATAS (Esta Semana)

### Alta Prioridad
1. [ ] Completar estructura del monorepo
2. [ ] Configurar Prisma con schema multi-tenant
3. [ ] Implementar Auth Module básico (login/register)
4. [ ] Crear docker-compose.yml funcional

### Media Prioridad
5. [ ] Setup básico de Next.js
6. [ ] Configurar CI/CD
7. [ ] Documentación inicial

### Baja Prioridad
8. [ ] Optimizaciones de desarrollo
9. [ ] Herramientas adicionales

---

## NOTAS TÉCNICAS

### Convenciones de Código
- **Nombres de tablas:** snake_case plural (users, academic_years)
- **Nombres de columnas:** camelCase (firstName, createdAt)
- **Endpoints:** kebab-case plural (/academic-years, /course-assignments)
- **Archivos:** kebab-case (auth.service.ts, create-user.dto.ts)

### Estructura de Commits
```
feat: add user registration endpoint
fix: resolve token refresh issue
docs: update API documentation
refactor: simplify auth guard logic
test: add e2e tests for login flow
chore: update dependencies
```

### Checklist de PR
- [ ] Tests pasan
- [ ] Lint sin errores
- [ ] Documentación actualizada
- [ ] Revisión de seguridad
- [ ] Performance aceptable

---

*Última actualización: Diciembre 2024*
