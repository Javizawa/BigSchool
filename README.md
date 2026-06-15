# BigSchool

Tienda online de zapatillas desarrollada con Angular, NestJS y Supabase.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular (última versión) + Tailwind CSS |
| Backend | NestJS (Node.js + TypeScript) |
| Base de datos | Supabase (PostgreSQL gestionado) |
| Autenticación | Supabase Auth (email/password + Google OAuth) |
| Imágenes | Cloudinary |
| Pagos | Stripe |
| API spec | OpenAPI 3.1 (design-first) |
| Tests E2E | Playwright |
| CI/CD | GitHub Actions |

## Estructura del repositorio

```
BigSchool/
├── .github/
│   ├── workflows/
│   │   └── ci.yml              # Pipeline de CI (lint, tests, build)
│   ├── dependabot.yml          # Actualizaciones automáticas de dependencias
│   └── pull_request_template.md
├── docs/
│   └── openapi/
│       └── openapi.yaml        # Spec OpenAPI 3.1 (fuente de verdad)
├── frontend/                   # Angular app
├── backend/                    # NestJS app
├── .claude/
│   └── CLAUDE.md               # Documentación del proyecto para Claude Code
├── .env.example                # Plantilla de variables de entorno
├── .gitignore
├── .spectral.yaml              # Reglas de linting del spec OpenAPI
└── README.md
```

## Requisitos previos

- Node.js >= 20
- npm >= 10
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Cloudinary](https://cloudinary.com)
- Cuenta en [Stripe](https://stripe.com)

## Configuración del entorno

```bash
# Clonar el repositorio
git clone https://github.com/Javizawa/BigSchool.git
cd BigSchool

# Configurar variables de entorno del backend
cp .env.example backend/.env
# Editar backend/.env con los valores reales

# Configurar variables de entorno del frontend
cp .env.example frontend/.env
# Editar frontend/.env con los valores reales
```

Consulta [.env.example](.env.example) para ver todas las variables necesarias y dónde obtenerlas.

## Instalación y desarrollo

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run start
```

La aplicación estará disponible en:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

## Tests

```bash
# Backend — unit tests
cd backend && npm run test

# Backend — tests con coverage
cd backend && npm run test:cov

# Backend — tests E2E
cd backend && npm run test:e2e

# Frontend — unit tests
cd frontend && npm run test

# E2E con Playwright
npx playwright test
```

## Convenciones del proyecto

### Ramas (GitHub Flow)

- `main` — rama principal, siempre desplegable
- `feature/nombre-de-la-feature` — nuevas funcionalidades
- `fix/descripcion-del-bug` — correcciones
- `chore/descripcion` — mantenimiento, dependencias, configuración

Toda rama se mergea a `main` mediante Pull Request con al menos una revisión aprobada.

### Commits (Conventional Commits)

```
feat: añadir endpoint de wishlist
fix: corregir cálculo de descuento en carrito
chore: actualizar dependencias de NestJS
docs: actualizar spec OpenAPI con endpoints de returns
test: añadir tests de integración para órdenes
```

### Proceso design-first

1. Modificar `docs/openapi/openapi.yaml` antes de tocar el código
2. El PR debe incluir la actualización del spec si hay cambio en la API
3. El spec se valida automáticamente en CI con Spectral

## Secretos en GitHub Actions

Para que el pipeline de CI funcione, configurar los siguientes secretos en:
`GitHub → Repository → Settings → Secrets and variables → Actions`

| Secret | Descripción |
|--------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase |
| `SUPABASE_JWT_SECRET` | Secret JWT de Supabase |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Upload preset sin firma de Cloudinary |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe |

## GitHub Projects

El seguimiento de tareas se gestiona en [GitHub Projects](https://github.com/Javizawa/BigSchool/projects).

Columnas del tablero:
- **Backlog** — ideas y funcionalidades pendientes de planificar
- **Ready** — listo para desarrollar (spec y criterios de aceptación definidos)
- **In Progress** — en desarrollo activo
- **In Review** — PR abierto, pendiente de revisión
- **Done** — mergeado a main

## Documentación de la API

El spec OpenAPI completo está en [`docs/openapi/openapi.yaml`](docs/openapi/openapi.yaml).

Cuando el backend esté en marcha, la documentación interactiva (Swagger UI) estará disponible en `http://localhost:3000/api/docs`.

## Licencia

Proyecto privado — todos los derechos reservados.
