# 🎓 LMS Perú

Plataforma LMS modular para colegios del Perú, construida con NestJS y Next.js.

## 🚀 Quick Start

### Requisitos

- Node.js 20+
- pnpm 8+
- Docker y Docker Compose

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-org/lms-peru.git
cd lms-peru

# Instalar dependencias
pnpm install

# Iniciar servicios (PostgreSQL, Redis)
docker-compose up -d

# Configurar variables de entorno
cp .env.example .env

# Generar cliente Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate

# Iniciar en desarrollo
pnpm dev
```

### URLs de desarrollo

| Servicio | URL |
|----------|-----|
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/docs |
| Web | http://localhost:3000 |
| pgAdmin | http://localhost:5050 |
| Redis Commander | http://localhost:8081 |

## 📁 Estructura del Proyecto

```
lms-peru/
├── apps/
│   ├── api/              # Backend NestJS
│   │   ├── src/
│   │   │   ├── common/   # Utilidades compartidas
│   │   │   ├── config/   # Configuración
│   │   │   ├── database/ # Prisma & DB
│   │   │   └── modules/  # Módulos de negocio
│   │   └── prisma/       # Schema y migraciones
│   │
│   └── web/              # Frontend Next.js
│       └── src/
│           ├── app/      # App Router
│           ├── components/
│           └── lib/
│
├── packages/
│   ├── shared-types/     # Tipos TypeScript compartidos
│   └── eslint-config/    # Configuración ESLint
│
├── docs/                 # Documentación
├── scripts/              # Scripts de utilidad
└── docker-compose.yml    # Servicios de desarrollo
```

## 🛠️ Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar todos los servicios
pnpm dev --filter api # Solo API
pnpm dev --filter web # Solo Web

# Build
pnpm build            # Build de producción

# Testing
pnpm test             # Tests unitarios
pnpm test:e2e         # Tests end-to-end
pnpm test:cov         # Coverage

# Base de datos
pnpm db:generate      # Generar cliente Prisma
pnpm db:migrate       # Ejecutar migraciones
pnpm db:push          # Push schema (dev)
pnpm db:studio        # Abrir Prisma Studio

# Docker
pnpm docker:up        # Iniciar servicios
pnpm docker:down      # Detener servicios
pnpm docker:logs      # Ver logs

# Linting
pnpm lint             # Verificar código
pnpm lint:fix         # Corregir automáticamente
pnpm format           # Formatear código
```

## 🏗️ Arquitectura

### Backend (NestJS)

- **Monolito Modular**: Módulos independientes pero en un solo deployment
- **Multi-tenant**: Aislamiento de datos por institución con RLS
- **Tolerancia a fallos**: Circuit Breakers y Bulkheads
- **API REST**: Documentada con Swagger/OpenAPI

### Frontend (Next.js)

- **App Router**: Usando la nueva arquitectura de Next.js 14
- **Server Components**: Renderizado del lado del servidor
- **Tailwind CSS**: Estilos utilitarios
- **Shadcn/ui**: Componentes accesibles

### Base de Datos

- **PostgreSQL 16**: Base de datos principal
- **Prisma ORM**: Type-safe database access
- **Redis**: Cache, sesiones y colas

## 📚 Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Auth | 🔄 En progreso | Autenticación JWT |
| Users | 📅 Pendiente | Gestión de usuarios |
| Tenants | 📅 Pendiente | Multi-tenancy |
| Academic | 📅 Pendiente | Estructura académica |
| Grades | 📅 Pendiente | Calificaciones |
| Attendance | 📅 Pendiente | Asistencia |
| Reports | ✅ Implementado | Reportes (ejemplo) |
| Health | ✅ Implementado | Health checks |

## 🔒 Seguridad

- JWT con refresh tokens
- Rate limiting
- Helmet (headers de seguridad)
- Validación de inputs
- CORS configurado
- Row Level Security (PostgreSQL)

## 📖 Documentación

- [Roadmap](./docs/ROADMAP.md)
- [Tasklist](./docs/TASKLIST.md)
- [API Docs](http://localhost:3001/docs)

## 🤝 Contribuir

1. Fork el repositorio
2. Crear rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT
