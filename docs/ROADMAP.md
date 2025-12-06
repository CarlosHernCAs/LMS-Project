# ROADMAP LMS PERÚ - VERSIÓN CORREGIDA

## Resumen Ejecutivo

Este roadmap corrige los problemas identificados en la propuesta original:
- ❌ Microservicios innecesarios → ✅ Monolito modular
- ❌ 10 bases de datos → ✅ 1 BD con schemas + RLS
- ❌ Keycloak → ✅ Auth nativo con JWT
- ❌ 12 meses irrealista → ✅ 18 meses MVP realista
- ❌ GraphQL + REST → ✅ Solo REST
- ❌ Kubernetes desde inicio → ✅ Docker Compose → K8s después

---

## ARQUITECTURA FINAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LMS PERÚ - ARQUITECTURA                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      FRONTEND (Next.js)                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │
│  │  │ Portal  │ │ Portal  │ │ Portal  │ │ Portal  │           │    │
│  │  │ Admin   │ │ Docente │ │ Alumno  │ │ Padre   │           │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    API GATEWAY (NestJS)                      │    │
│  │  • Rate Limiting  • Auth Middleware  • Tenant Resolution    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 MONOLITO MODULAR (NestJS)                    │    │
│  │                                                               │    │
│  │  ┌──────────────────── CORE MODULES ────────────────────┐   │    │
│  │  │                                                        │   │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │    │
│  │  │  │  AUTH   │  │ USERS   │  │ TENANT  │  │  RBAC   │  │   │    │
│  │  │  │ Module  │  │ Module  │  │ Module  │  │ Module  │  │   │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │    │
│  │  │                                                        │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │                                                               │    │
│  │  ┌──────────────── ACADEMIC MODULES ────────────────────┐   │    │
│  │  │                                                        │   │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │    │
│  │  │  │ACADEMIC │  │ GRADES  │  │ATTENDANCE│ │CURRICULUM│  │   │    │
│  │  │  │ Module  │  │ Module  │  │ Module  │  │ Module  │  │   │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │    │
│  │  │                                                        │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │                                                               │    │
│  │  ┌──────────────── SUPPORT MODULES ─────────────────────┐   │    │
│  │  │                                                        │   │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │    │
│  │  │  │ CONTENT │  │MESSAGING│  │ REPORTS │  │ANALYTICS│  │   │    │
│  │  │  │ Module  │  │ Module  │  │ Module  │  │ Module  │  │   │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │    │
│  │  │                                                        │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │                                                               │    │
│  │  ┌──────────────── CROSS-CUTTING ───────────────────────┐   │    │
│  │  │  Resilience │ Logging │ Caching │ Events │ Queue     │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   PostgreSQL (Multi-Schema)                  │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │    │
│  │  │ public │ │  auth  │ │academic│ │ grades │ │ content│    │    │
│  │  │ schema │ │ schema │ │ schema │ │ schema │ │ schema │    │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │    │
│  │                    + Row Level Security (RLS)                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │  Redis (Cache + Sessions + Queues)  │  MinIO (Files)        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FASES DEL PROYECTO

### FASE 0: PREPARACIÓN (2 semanas)
**Objetivo:** Configurar entorno de desarrollo y estructura base

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| Configurar monorepo | Turborepo + pnpm workspaces | Estructura de proyecto |
| Setup NestJS | Proyecto base con configuración | API funcionando |
| Setup Next.js | Frontend base | Web funcionando |
| Docker Compose | Entorno de desarrollo local | BD + Redis corriendo |
| CI/CD básico | GitHub Actions | Pipeline de pruebas |
| Documentación | ADRs y convenciones | docs/ folder |

---

### FASE 1: NÚCLEO DEL SISTEMA (Meses 1-4)

#### Sprint 1-2: Autenticación y Multi-Tenancy
**Duración:** 4 semanas

```
Módulos a implementar:
├── Auth Module
│   ├── Login/Logout
│   ├── JWT + Refresh Tokens
│   ├── Password reset
│   └── Session management
│
├── Tenant Module
│   ├── Institution registration
│   ├── Tenant resolution (subdomain/header)
│   ├── Row Level Security setup
│   └── Tenant configuration
│
└── User Module
    ├── CRUD usuarios
    ├── Profile management
    └── Avatar upload
```

**Entregables:**
- [ ] Login funcional con JWT
- [ ] Multi-tenant con aislamiento de datos
- [ ] API de gestión de usuarios
- [ ] Tests unitarios (>80% coverage)

#### Sprint 3-4: Sistema de Roles y Permisos
**Duración:** 4 semanas

```
RBAC Module:
├── Roles
│   ├── SUPER_ADMIN (plataforma)
│   ├── INSTITUTION_ADMIN (colegio)
│   ├── ACADEMIC_COORDINATOR
│   ├── TEACHER
│   ├── TUTOR
│   ├── STUDENT
│   ├── PARENT
│   └── AUXILIARY
│
├── Permissions
│   ├── Resource-based (users:read, grades:write)
│   ├── Scope-based (own, section, institution)
│   └── Custom per institution
│
└── Guards & Decorators
    ├── @Roles()
    ├── @Permissions()
    └── @TenantScoped()
```

**Entregables:**
- [ ] Sistema RBAC completo
- [ ] Guards de autorización
- [ ] Panel de administración de roles
- [ ] Documentación de permisos

#### Sprint 5-6: Modelo Académico Base
**Duración:** 4 semanas

```
Academic Module:
├── Institutions
│   ├── Datos generales
│   ├── Código modular MINEDU
│   ├── UGEL/DRE
│   └── Configuración
│
├── Academic Years
│   ├── Año escolar
│   ├── Períodos (bimestres/trimestres)
│   ├── Fechas importantes
│   └── Estado (activo/cerrado)
│
├── Levels & Grades
│   ├── Niveles (inicial, primaria, secundaria)
│   ├── Grados (1°, 2°, etc.)
│   └── Secciones (A, B, C)
│
└── Enrollments
    ├── Matrícula de estudiantes
    ├── Asignación a secciones
    └── Historial de traslados
```

**Entregables:**
- [ ] CRUD completo de estructura académica
- [ ] Proceso de matrícula
- [ ] Importación masiva de alumnos (Excel)
- [ ] API documentada con Swagger

#### Sprint 7-8: Currículo Nacional (CNEB)
**Duración:** 4 semanas

```
Curriculum Module:
├── Areas Curriculares
│   ├── Matemática
│   ├── Comunicación
│   ├── Ciencia y Tecnología
│   ├── Personal Social
│   ├── etc.
│
├── Competencias
│   ├── Por área
│   ├── Estándares de aprendizaje
│   └── Desempeños por grado
│
├── Course Assignments
│   ├── Docente → Sección → Área
│   ├── Horarios
│   └── Carga horaria
│
└── Plan de Estudios
    ├── Distribución por nivel
    ├── Horas semanales
    └── Áreas obligatorias/electivas
```

**Entregables:**
- [ ] Catálogo del CNEB cargado
- [ ] Asignación de docentes a cursos
- [ ] Gestión de horarios básica
- [ ] Plantillas por nivel educativo

---

### FASE 2: FUNCIONALIDADES CORE (Meses 5-9)

#### Sprint 9-12: Sistema de Calificaciones
**Duración:** 8 semanas

```
Grades Module:
├── Evaluaciones
│   ├── Por competencia (AD, A, B, C)
│   ├── Por indicador
│   ├── Notas numéricas (si aplica)
│   └── Conclusiones descriptivas
│
├── Registro de Notas
│   ├── Por período
│   ├── Por docente
│   ├── Validaciones automáticas
│   └── Bloqueo por período cerrado
│
├── Cálculos Automáticos
│   ├── Promedio por área
│   ├── Promedio general
│   ├── Orden de mérito
│   └── Situación final
│
├── Actas y Boletas
│   ├── Generación de boletas PDF
│   ├── Actas consolidadas
│   ├── Formato MINEDU
│   └── Firma digital (futuro)
│
└── Historial Académico
    ├── Récord por estudiante
    ├── Años anteriores
    └── Certificados
```

**Entregables:**
- [ ] Registro de notas por competencia
- [ ] Cálculo automático de promedios
- [ ] Generación de boletas PDF
- [ ] Actas consolidadas
- [ ] Historial académico

#### Sprint 13-14: Sistema de Asistencia
**Duración:** 4 semanas

```
Attendance Module:
├── Registro Diario
│   ├── Por sección
│   ├── Estados: presente, ausente, tardanza, justificado
│   ├── Observaciones
│   └── Registro por QR (opcional)
│
├── Justificaciones
│   ├── Solicitud por padre
│   ├── Aprobación por tutor
│   └── Documentos adjuntos
│
├── Reportes
│   ├── Consolidado mensual
│   ├── Por estudiante
│   ├── Por sección
│   └── Alertas de inasistencia
│
└── Notificaciones
    ├── Email a padres
    ├── Push notifications
    └── Alertas automáticas
```

**Entregables:**
- [ ] Registro de asistencia diario
- [ ] Sistema de justificaciones
- [ ] Reportes de asistencia
- [ ] Alertas automáticas a padres

#### Sprint 15-16: Comunicación
**Duración:** 4 semanas

```
Messaging Module:
├── Mensajes Internos
│   ├── Docente ↔ Padre
│   ├── Tutor ↔ Padres de sección
│   ├── Admin → Todos
│   └── Bandeja de entrada
│
├── Anuncios
│   ├── Por institución
│   ├── Por sección
│   ├── Por nivel
│   └── Programados
│
├── Notificaciones
│   ├── Email
│   ├── Push (PWA)
│   ├── En-app
│   └── Preferencias por usuario
│
└── Calendario
    ├── Eventos institucionales
    ├── Fechas de evaluación
    ├── Reuniones
    └── Sincronización
```

**Entregables:**
- [ ] Sistema de mensajería interna
- [ ] Anuncios y comunicados
- [ ] Notificaciones multi-canal
- [ ] Calendario institucional

---

### FASE 3: FRONTEND (Meses 10-13)

#### Sprint 17-20: Portales de Usuario
**Duración:** 8 semanas

```
Frontend Modules:
├── Portal Administrativo
│   ├── Dashboard ejecutivo
│   ├── Gestión de usuarios
│   ├── Configuración institucional
│   ├── Reportes gerenciales
│   └── Auditoría
│
├── Portal Docente
│   ├── Mis cursos
│   ├── Registro de notas
│   ├── Asistencia
│   ├── Materiales
│   └── Comunicación
│
├── Portal Alumno
│   ├── Mis notas
│   ├── Mi asistencia
│   ├── Materiales de clase
│   ├── Tareas
│   └── Calendario
│
└── Portal Padre/Apoderado
    ├── Notas de mis hijos
    ├── Asistencia
    ├── Comunicación con docentes
    ├── Pagos (futuro)
    └── Citas
```

**Entregables:**
- [ ] Dashboard administrativo completo
- [ ] Portal docente funcional
- [ ] Portal alumno
- [ ] Portal padre/apoderado
- [ ] Responsive design (mobile-first)
- [ ] PWA básico

---

### FASE 4: VALOR AGREGADO (Meses 14-18)

#### Sprint 21-22: Contenido y Materiales
**Duración:** 4 semanas

```
Content Module:
├── Biblioteca de Recursos
│   ├── Documentos (PDF, Word)
│   ├── Videos (links externos)
│   ├── Presentaciones
│   └── Enlaces útiles
│
├── Organización
│   ├── Por curso
│   ├── Por unidad/tema
│   ├── Por tipo
│   └── Búsqueda
│
└── Compartir
    ├── Con sección
    ├── Con institución
    └── Entre docentes
```

#### Sprint 23-24: Reportes y Analytics
**Duración:** 4 semanas

```
Reports Module:
├── Reportes Académicos
│   ├── Consolidados por período
│   ├── Comparativos
│   ├── Ranking
│   └── Evolución
│
├── Reportes de Gestión
│   ├── Matrícula
│   ├── Asistencia global
│   ├── Docentes
│   └── Uso de plataforma
│
└── Analytics
    ├── Dashboard BI básico
    ├── Tendencias
    ├── Predicción de riesgo (básico)
    └── Exportación Excel
```

#### Sprint 25-26: Optimización y Seguridad
**Duración:** 4 semanas

```
Optimizations:
├── Performance
│   ├── Query optimization
│   ├── Caching strategy
│   ├── Lazy loading
│   └── CDN para assets
│
├── Seguridad
│   ├── Penetration testing
│   ├── Security audit
│   ├── OWASP compliance
│   └── Data encryption review
│
└── Monitoreo
    ├── APM setup
    ├── Error tracking
    ├── Alertas
    └── Logs centralizados
```

#### Sprint 27-28: Piloto y Lanzamiento
**Duración:** 4 semanas

```
Launch:
├── Piloto
│   ├── 2-3 colegios de prueba
│   ├── Feedback loop
│   ├── Bug fixes
│   └── Ajustes UX
│
├── Documentación
│   ├── Manual de usuario
│   ├── Videos tutoriales
│   ├── FAQ
│   └── Guía de administrador
│
└── Go-Live
    ├── Migración de datos
    ├── Capacitación
    ├── Soporte inicial
    └── Monitoreo intensivo
```

---

## STACK TECNOLÓGICO FINAL

### Backend
| Tecnología | Propósito | Versión |
|------------|-----------|---------|
| NestJS | Framework principal | 10.x |
| TypeScript | Lenguaje | 5.x |
| PostgreSQL | Base de datos | 16.x |
| Prisma | ORM | 5.x |
| Redis | Cache + Sessions + Queues | 7.x |
| Bull | Job queues | 4.x |
| Passport | Autenticación | 0.7.x |
| class-validator | Validación | 0.14.x |

### Frontend
| Tecnología | Propósito | Versión |
|------------|-----------|---------|
| Next.js | Framework React | 14.x |
| React | UI Library | 18.x |
| TypeScript | Lenguaje | 5.x |
| TailwindCSS | Estilos | 3.x |
| Shadcn/ui | Componentes | latest |
| React Query | Data fetching | 5.x |
| Zustand | Estado global | 4.x |
| React Hook Form | Formularios | 7.x |

### Infraestructura
| Tecnología | Propósito | Cuándo |
|------------|-----------|--------|
| Docker | Contenedores | Desde día 1 |
| Docker Compose | Dev environment | Desde día 1 |
| GitHub Actions | CI/CD | Desde día 1 |
| Nginx | Reverse proxy | Producción |
| Kubernetes | Orquestación | Post-lanzamiento |

### Servicios Externos
| Servicio | Propósito | Alternativa |
|----------|-----------|-------------|
| Resend/SendGrid | Emails | SMTP propio |
| Cloudflare | CDN + DNS | AWS CloudFront |
| Sentry | Error tracking | Self-hosted |
| MinIO | Almacenamiento | S3/Spaces |

---

## MÉTRICAS DE ÉXITO (KPIs REALISTAS)

### Técnicos
| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Disponibilidad | 99.5% | Uptime mensual |
| Tiempo de respuesta (P95) | < 500ms | APM |
| Tiempo de carga inicial | < 3s | Lighthouse |
| Cobertura de tests | > 80% | Jest |
| Deuda técnica | < 5% | SonarQube |

### Negocio
| Métrica | Objetivo | Plazo |
|---------|----------|-------|
| Colegios en piloto | 3 | Mes 16 |
| Usuarios activos/día | > 60% | Mes 18 |
| NPS (satisfacción) | > 40 | Mes 18 |
| Tickets de soporte/mes | < 50 | Mes 18 |
| Tiempo de onboarding | < 1 semana | Mes 18 |

---

## RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Alcance excesivo | Alta | Alto | MVP estricto, features priorizadas |
| Resistencia al cambio | Media | Alto | Capacitación, UX simple |
| Problemas de performance | Media | Alto | Testing de carga, monitoreo |
| Integración SIAGIE | Alta | Medio | API wrapper, modo offline |
| Rotación de equipo | Media | Alto | Documentación, pair programming |

---

## PRESUPUESTO ESTIMADO (Infraestructura MVP)

### Desarrollo (Mensual)
| Recurso | Costo/mes |
|---------|-----------|
| VPS desarrollo (4GB RAM) | $20 |
| Base de datos (managed) | $25 |
| Dominio + SSL | $2 |
| Emails transaccionales | $10 |
| **Total desarrollo** | **~$57/mes** |

### Producción (Mensual - 5 colegios)
| Recurso | Costo/mes |
|---------|-----------|
| VPS producción (8GB RAM) | $40 |
| Base de datos (managed) | $50 |
| Redis (managed) | $15 |
| Almacenamiento (100GB) | $5 |
| CDN + DNS | $0-20 |
| Backups | $10 |
| Monitoreo | $0-30 |
| **Total producción** | **~$120-170/mes** |

---

## PRÓXIMOS PASOS INMEDIATOS

1. **Esta semana:** Completar estructura base del proyecto
2. **Semana 2:** Implementar Auth Module completo
3. **Semana 3-4:** Multi-tenancy + User Module
4. **Mes 2:** RBAC + Academic Module base

---

*Documento generado: Diciembre 2024*
*Versión: 2.0 (Corregida)*
*Autor: LMS Perú Team*
