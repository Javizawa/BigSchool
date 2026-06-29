# Love4Sneakers

Tienda online de zapatillas deportivas y lifestyle desarrollada con Angular, NestJS y Supabase. El proyecto sigue un enfoque **design-first** con OpenAPI 3.1 como fuente de verdad, generación automática de tipos/clientes desde el spec, e integra un **agente conversacional de IA** que ayuda a los usuarios a encontrar productos en tiempo real.

---

## Descripción general

Love4Sneakers permite al usuario navegar un catálogo de zapatillas por marca, categoría, género, talla y precio; añadir productos a la wishlist y al carrito; completar el pago con Stripe; gestionar pedidos y solicitar devoluciones. Los administradores disponen de un panel completo de backoffice. El agente de IA accede al catálogo real de la base de datos y, si el usuario está autenticado, también puede consultar el estado de sus pedidos.

---

## Stack tecnológico

| Capa | Tecnología | Función |
|------|-----------|---------|
| Frontend | Angular 22 (standalone + signals) | SPA del cliente |
| Estilos | Tailwind CSS v4 + Angular CDK | UI sin sistema de diseño impuesto |
| Backend | NestJS 11 (Node.js + TypeScript) | API REST |
| Base de datos | Supabase (PostgreSQL) | BD + Auth + Realtime |
| ORM | Prisma 7 | Acceso a datos tipado |
| Autenticación | Supabase Auth | Email/contraseña + Google OAuth |
| Imágenes | Cloudinary | CDN + transformaciones on-the-fly |
| Pagos | Stripe | PaymentIntent + webhooks |
| Agente IA | Groq — Llama 3.3 70B | Inferencia LLM con tool calling |
| API Spec | OpenAPI 3.1 | Fuente de verdad del contrato (design-first) |
| Generación frontend | Orval 8 | Angular services + tipos desde el spec |
| Generación backend | openapi-typescript 7 | Tipos TypeScript desde el spec |
| Linting del spec | Spectral | Validación de reglas OpenAPI en CI |
| Tests E2E | Playwright | Flujos críticos de usuario |
| CI/CD | GitHub Actions | Lint, tests, build y drift check del spec |

---

## Instalación y ejecución

### Requisitos previos

- Node.js >= 22
- npm >= 10
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Cloudinary](https://cloudinary.com)
- Cuenta en [Stripe](https://stripe.com)
- Cuenta en [Groq](https://console.groq.com) (clave de API gratuita)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Javizawa/Love4Sneakers.git
cd Love4Sneakers
```

### 2. Configurar variables de entorno

```bash
# Backend
cp .env.example backend/.env
# Editar backend/.env con los valores reales de Supabase, Cloudinary, Stripe y Groq

# Frontend
cp .env.example frontend/.env
# Editar frontend/.env con las variables públicas (prefijo NG_APP_)
```

Consulta [.env.example](.env.example) para ver todas las variables y dónde obtenerlas.

### 3. Instalar dependencias

```bash
# Dependencias raíz (Playwright + herramientas de generación de spec)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 4. Generar el cliente Prisma y poblar la base de datos

```bash
cd backend
npx prisma generate
npm run seed
```

### 5. Lanzar en desarrollo

```bash
# Terminal 1 — backend
cd backend && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm run start
```

La aplicación queda disponible en:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api/docs |

### 6. Despliegue en producción

El proyecto se despliega automáticamente al hacer merge a `main`:

| Servicio | Plataforma | URL |
|----------|-----------|-----|
| Frontend | Vercel | https://big-school-lime.vercel.app |
| Backend API | Railway | https://bigschool-production.up.railway.app/api/v1 |

#### Frontend — Vercel

Vercel detecta el directorio `frontend/` automáticamente. El build corre `npm run build`, que ejecuta primero `scripts/set-env.js` para escribir las variables de entorno en `src/environments/environment.prod.ts` antes de que compile Angular.

Variables que deben estar configuradas en **Vercel → Settings → Environment Variables** (Production):

| Variable | Descripción |
|----------|-------------|
| `NG_APP_API_URL` | URL base del backend (ej. `https://bigschool-production.up.railway.app/api/v1`) |
| `NG_APP_SUPABASE_URL` | URL del proyecto Supabase |
| `NG_APP_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `NG_APP_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `NG_APP_CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `NG_APP_CLOUDINARY_UPLOAD_PRESET` | Upload preset sin firma |

#### Backend — Railway

Railway construye la imagen con el `Dockerfile` del directorio `backend/` y arranca con `node dist/src/main`.

Variables que deben estar configuradas en **Railway → Variables**:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL de Supabase |
| `DIRECT_URL` | URL directa de Supabase (para migraciones Prisma) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase |
| `SUPABASE_JWT_SECRET` | Secret JWT de Supabase |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Upload preset sin firma |
| `GROQ_API_KEY` | Clave de API de Groq (agente IA) |
| `CORS_ORIGIN` | URL del frontend (ej. `https://big-school-lime.vercel.app`) |

---

## Estructura del proyecto

```
Love4Sneakers/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  # Pipeline CI: lint, tests, build, drift check
│   ├── dependabot.yml
│   └── pull_request_template.md
├── docs/
│   └── openapi/
│       └── openapi.yaml            # Spec OpenAPI 3.1 — FUENTE DE VERDAD
├── frontend/                       # Angular 22 app
│   └── src/app/
│       ├── core/
│       │   ├── api/
│       │   │   ├── generated/      # Servicios Angular + tipos generados por Orval
│       │   │   └── *.api.ts        # Servicios HTTP artesanales
│       │   ├── auth/               # AuthService (Supabase)
│       │   ├── guards/             # auth.guard, admin.guard
│       │   ├── interceptors/       # auth.interceptor (JWT)
│       │   ├── models/             # Tipos de dominio
│       │   └── services/           # cart.service, wishlist.service
│       ├── features/
│       │   ├── admin/              # Panel de administración
│       │   ├── auth/               # Login, registro, callback OAuth
│       │   ├── cart/               # Carrito de compra
│       │   ├── checkout/           # Flujo de pago Stripe
│       │   ├── home/               # Página principal
│       │   ├── products/           # Listado y detalle de productos
│       │   ├── size-guide/         # Guía de tallas
│       │   └── user/               # Perfil, pedidos, devoluciones, wishlist
│       ├── layouts/                # main-layout, admin-layout
│       └── shared/
│           └── components/
│               └── chat-widget/    # Widget del agente IA
├── backend/                        # NestJS 11 app
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── modules/
│       │   ├── admin/              # CRUD backoffice (productos, pedidos, usuarios…)
│       │   ├── agent/              # Agente IA: controller, service, tools
│       │   ├── auth/               # Sincronización usuario Supabase
│       │   ├── brands/             # Marcas
│       │   ├── cart/               # Carrito
│       │   ├── categories/         # Categorías
│       │   ├── coupons/            # Cupones
│       │   ├── newsletter/         # Suscripción newsletter
│       │   ├── orders/             # Pedidos
│       │   ├── payments/           # Stripe PaymentIntent
│       │   ├── products/           # Catálogo
│       │   ├── returns/            # Devoluciones
│       │   ├── reviews/            # Valoraciones
│       │   ├── size-guide/         # Guía de tallas
│       │   ├── users/              # Perfil de usuario
│       │   └── webhooks/           # Webhook de Stripe
│       └── types/
│           └── api.ts              # Tipos TypeScript generados desde el spec
├── orval.config.ts                 # Configuración de generación frontend
├── .spectral.yaml                  # Reglas de linting del spec OpenAPI
├── playwright.config.ts
└── package.json                    # Raíz: scripts generate:api + Playwright
```

---

## Funcionalidades principales

### Catálogo público

- Listado de zapatillas con filtros por marca, categoría, género, talla, precio y oferta
- Ordenación y paginación del catálogo
- Detalle de producto con galería de imágenes (Cloudinary), variantes por talla y color, y disponibilidad de stock
- Valoraciones de productos con puntuación media y distribución de estrellas
- Guía de tallas (EU / US / UK / cm)
- Suscripción a newsletter

### Autenticación

- Registro e inicio de sesión con email y contraseña
- Inicio de sesión con Google OAuth
- JWT de Supabase enviado en cada petición al backend; NestJS valida la firma sin generar tokens propios
- Guardias funcionales para rutas de usuario y de administrador
- Interceptor HTTP que inyecta el token automáticamente

### Zona de usuario

- Gestión de perfil (nombre, teléfono, avatar)
- Direcciones de envío (múltiples, con dirección por defecto)
- Wishlist (añadir y eliminar productos)
- Historial de pedidos con detalle de cada línea y estado de envío
- Solicitud y seguimiento de devoluciones
- Notificaciones de reposición de stock para variantes agotadas

### Carrito y checkout

- Carrito persistente en base de datos (sincronizado entre sesiones)
- Aplicación de cupones de descuento (porcentaje o importe fijo)
- Flujo de pago completo con Stripe:
  1. Creación del pedido en estado `pending_payment`
  2. Generación de `PaymentIntent` en Stripe
  3. Integración con Stripe.js en el frontend
  4. Webhook de confirmación que actualiza el pedido a `confirmed`

### Panel de administración

- CRUD completo de productos con variantes (talla, color, stock, imágenes via Cloudinary)
- Gestión de categorías y marcas
- Gestión de pedidos (cambio de estado, añadir tracking de envío, notas internas)
- Gestión de devoluciones (aprobar, rechazar, procesar reembolso)
- Gestión de usuarios (cambio de rol, suspensión)
- Gestión de cupones de descuento (tipo, valor, fechas de validez, límite de usos)
- Dashboard de analíticas: ingresos, pedidos, usuarios nuevos y variantes con stock bajo

### Agente conversacional IA

Widget de chat flotante disponible en toda la tienda. Está impulsado por **Groq** con el modelo **Llama 3.3 70B** y utiliza *tool calling* para acceder a datos reales en tiempo real.

**Herramientas disponibles por rol:**

| Herramienta | Anónimo | Usuario | Admin |
|-------------|:-------:|:-------:|:-----:|
| `search_products` — busca en el catálogo con filtros | ✓ | ✓ | ✓ |
| `get_product_details` — variantes, tallas y stock exactos | ✓ | ✓ | ✓ |
| `recommend_products` — productos relacionados | ✓ | ✓ | ✓ |
| `get_order_status` — estado de un pedido del usuario | — | ✓ | ✓ |
| `get_sales_analytics` — métricas de ventas del periodo | — | — | ✓ |

El agente mantiene contexto conversacional en sesión (TTL de 30 minutos), responde en el idioma del usuario, formatea las respuestas en Markdown (renderizado en el widget) e incluye enlaces directos a las fichas de producto.

### Spec-Driven Development (SDD)

El proyecto implementa un ciclo completo de desarrollo orientado al spec:

1. **Fuente de verdad** — `docs/openapi/openapi.yaml` (OpenAPI 3.1)
2. **Linting** — Spectral valida que todos los endpoints tengan `operationId` y `tags`
3. **Generación frontend** — Orval genera Angular services (`HttpClient`) y tipos TypeScript en `frontend/src/app/core/api/generated/`
4. **Generación backend** — openapi-typescript genera interfaces `paths`, `components` y `operations` en `backend/src/types/api.ts`
5. **Detección de drift en CI** — el job `spec-codegen` regenera y falla el PR si los ficheros generados no están sincronizados con el spec

```bash
# Regenerar tipos y servicios desde el spec (ejecutar tras modificar openapi.yaml)
npm run generate:api
```

---

## Credenciales de prueba

### Stripe (pagos de prueba)

Stripe está en **modo test** — ninguna transacción es real. Usa estos datos en el formulario de pago:

| Campo | Valor |
|-------|-------|
| Número de tarjeta | `4242 4242 4242 4242` |
| Fecha de caducidad | Cualquier fecha futura (ej. `12/28`) |
| CVC | Cualquier 3 dígitos (ej. `123`) |
| Código postal | Cualquier 5 dígitos (ej. `12345`) |

Otras tarjetas de prueba útiles:

| Tarjeta | Resultado |
|---------|-----------|
| `4000 0000 0000 9995` | Pago rechazado (fondos insuficientes) |
| `4000 0025 0000 3155` | Requiere autenticación 3D Secure |

Consulta el [catálogo completo de tarjetas de test de Stripe](https://stripe.com/docs/testing#cards).

---

Los usuarios se gestionan a través de **Supabase Auth**. Para probar la aplicación en local:

### Usuarios de prueba (entorno de producción)

Puedes usar estas cuentas directamente en [big-school-lime.vercel.app](https://big-school-lime.vercel.app):

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Usuario normal | `usuario@user.com` | `usuario` |
| Administrador | `salvadorj@monlau.com` | `salvadorj` |

### Crear usuario de prueba (rol USER)

1. Accede a `http://localhost:4200/auth/register`
2. Regístrate con cualquier email y contraseña

### Crear usuario administrador (rol ADMIN)

1. Crea un usuario normal desde el registro o directamente en el panel de Supabase
2. En **Supabase Dashboard → Authentication → Users**, selecciona el usuario
3. En la sección **App metadata**, añade:
   ```json
   { "role": "ADMIN" }
   ```
4. Guarda y vuelve a iniciar sesión para que el JWT refleje el nuevo rol

### Usuario para el seed (base de datos de desarrollo)

El seed (`npm run seed`) crea marcas, categorías, productos y variantes, pero no crea usuarios de Supabase. Los usuarios se crean siempre desde el flujo de registro o el dashboard de Supabase.

---

## Tests

```bash
# Backend — unit tests
cd backend && npm run test

# Backend — cobertura
cd backend && npm run test:cov

# Backend — tests de integración
cd backend && npm run test:e2e

# Frontend — unit tests
cd frontend && npm run test

# E2E con Playwright
npx playwright test
```

---

## Convenciones del proyecto

### Ramas (GitHub Flow)

| Rama | Uso |
|------|-----|
| `main` | Producción — siempre desplegable |
| `feature/nombre` | Nuevas funcionalidades |
| `fix/descripcion` | Correcciones de bugs |
| `chore/descripcion` | Mantenimiento, dependencias, CI |

Todo cambio entra a `main` por Pull Request.

### Commits (Conventional Commits)

```
feat: añadir endpoint de wishlist
fix: corregir cálculo de descuento en carrito
docs: actualizar spec OpenAPI con returns
test: añadir tests de integración para órdenes
chore: actualizar dependencias de NestJS
```

### Flujo de trabajo design-first

Cualquier cambio que afecte a la API debe:

1. Modificar `docs/openapi/openapi.yaml` primero
2. Ejecutar `npm run generate:api` para regenerar tipos y servicios
3. Commitear spec + ficheros generados en el mismo PR
4. El CI bloqueará el PR si los ficheros generados no están sincronizados

---

## Secretos necesarios en GitHub Actions

Configurar en `GitHub → Repository → Settings → Secrets and variables → Actions`:

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
| `GROQ_API_KEY` | Clave de API de Groq (agente IA) |

---

## Documentación de la API

El spec OpenAPI completo está en [`docs/openapi/openapi.yaml`](docs/openapi/openapi.yaml).

La documentación interactiva (Swagger UI) está disponible mientras el backend está en marcha en `http://localhost:3000/api/docs`.

---

## Licencia

Proyecto privado — todos los derechos reservados.
