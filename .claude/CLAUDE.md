# BigSchool — Tienda online de zapatillas

## Stack

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Frontend | Angular (última versión) | Stack principal del proyecto |
| Backend | NestJS (Node.js + TypeScript) | Mismo lenguaje que Angular, soporte nativo OpenAPI |
| Base de datos | Supabase (PostgreSQL) | Auth + DB + Realtime + Storage en un servicio |
| Imágenes | Cloudinary | CDN + transformaciones on-the-fly gratuitas |
| Pagos | Stripe | PaymentIntent + webhooks |
| Estilos | Tailwind CSS + Angular CDK | Libertad de diseño sin imponer sistema visual |
| API spec | OpenAPI 3.1 — `docs/openapi/openapi.yaml` | Fuente de verdad (design-first) |
| Agente IA | Groq (Llama 3.3 70B) — `groq-sdk` | Inferencia gratuita con tool calling |

## Estructura del proyecto

```
BigSchool/
├── docs/
│   └── openapi/
│       └── openapi.yaml   ← Contrato de la API (FUENTE DE VERDAD)
├── frontend/              ← Angular app
├── backend/               ← NestJS app
└── .claude/
    └── CLAUDE.md
```

## Autenticación (Supabase Auth)

- Registro, login, logout y OAuth (Google) se gestionan en el **cliente** con el SDK de Supabase
- El cliente envía el JWT de Supabase como `Authorization: Bearer <token>`
- NestJS valida el JWT contra la clave pública de Supabase — no genera tokens propios
- Roles: `USER` (defecto) | `ADMIN` (acceso a rutas `/admin/*`)

## Convenciones Angular

- **Solo Standalone components** — sin NgModules
- **Signals** para todo el estado reactivo (no Subject/BehaviorSubject)
- **Signal-based forms** — no ReactiveFormsModule clásico
- **Control flow declarativo** — `@if`, `@for`, `@switch`, `@defer`
- **Model inputs** para two-way binding
- **Functional guards y resolvers**
- **Angular MCP server** (`@angular/mcp`) habilitado para integración con Claude Code
- Sin Zone.js donde sea posible (zoneless experimental)

## Imágenes (Cloudinary)

Todas las URLs de imagen son URLs de Cloudinary.
Transformaciones: añadir parámetros a la URL → `f_auto,q_auto,w_400`

## Flujo de pago (Stripe)

1. `POST /orders` → crea pedido en estado `pending_payment`
2. `POST /payments/intent` → crea PaymentIntent en Stripe, devuelve `clientSecret`
3. Frontend completa el pago con `Stripe.js` usando el `clientSecret`
4. Stripe envía webhook a `POST /webhooks/stripe` → pedido pasa a `confirmed`

## Dominios del API

**Públicos:** products, categories, brands, size-guide, newsletter, reviews (lectura)

**Usuario autenticado:** auth/me, users/me, addresses, wishlist, reviews (escritura), cart, coupons/validate, payments, orders, returns, stock-notifications

**Solo ADMIN:** `/admin/*` — productos, variantes, categorías, marcas, pedidos, usuarios, cupones, devoluciones, analytics

**Webhooks:** `/webhooks/stripe` (sin auth JWT, verificación por firma Stripe)

**Agente IA:** `POST /agent/chat` — auth opcional; herramientas disponibles según rol (anónimo, USER, ADMIN). Proveedor: Groq (Llama 3.3 70B). Sesión conversacional por `sessionId` UUID.

## Flujo de trabajo design-first

1. Modificar `openapi.yaml` primero
2. Validar el spec
3. Generar tipos/clientes desde el spec
4. Implementar lógica en backend
5. Consumir desde frontend con cliente generado

## Zona de administración

Ruta protegida con guardia funcional que verifica rol `ADMIN` en el token Supabase.
Funcionalidades: CRUD productos/variantes, gestión de pedidos y envíos, cupones, devoluciones, usuarios, analytics.

## Zona de usuario

Ruta protegida con guardia funcional que verifica autenticación.
Funcionalidades: perfil, direcciones, pedidos, devoluciones, wishlist, notificaciones de stock.

## Gestión de cambios (regla invariable)

Cualquier modificación que cambie un concepto, endpoint, schema o decisión técnica del proyecto DEBE actualizar, en el mismo PR:
1. `docs/openapi/openapi.yaml` — si afecta a la API
2. `.claude/CLAUDE.md` — si afecta a stack, convenciones o arquitectura
3. `README.md` — si afecta a instrucciones de uso o configuración

## Estrategia de ramas (GitHub Flow)

- `main` — única rama de producción, siempre desplegable
- `feature/nombre` — nuevas funcionalidades
- `fix/descripcion` — correcciones de bugs
- `chore/descripcion` — mantenimiento, dependencias, CI

Todo cambio entra a `main` por Pull Request. La plantilla de PR en `.github/pull_request_template.md` define el checklist obligatorio.

## Commits (Conventional Commits)

Formato: `tipo: descripción en imperativo`

Tipos: `feat` | `fix` | `chore` | `docs` | `test` | `refactor` | `perf` | `ci`

Ejemplos:
- `feat: añadir endpoint de wishlist`
- `fix: corregir cálculo de descuento en carrito`
- `docs: actualizar spec OpenAPI con returns`
- `test: añadir tests de integración para órdenes`

## Testing

### Backend (NestJS + Jest)
- **Unit tests**: servicios, guards, pipes, transformers — mocks de repositorios
- **Integration tests**: controladores con supertest — base de datos de test en Supabase
- **E2E**: flujos completos (auth → cart → checkout → order)
- Cobertura mínima objetivo: 80%

### Frontend (Angular + Jest/Testing Library)
- **Unit tests**: componentes, servicios, pipes, guards
- **Integration tests**: páginas completas con HttpClientTestingModule
- **E2E**: Playwright — flujos críticos (registro, búsqueda, compra)

### Spec OpenAPI
- Validación automática en CI con Spectral (reglas en `.spectral.yaml`)
- Sin operationId → error. Sin tags → error.

## Gestión de secretos (.env)

- `.env.example` — comprometido en git, con valores placeholder
- `.env` — NUNCA comprometido (está en .gitignore)
- Variables de entorno en CI via GitHub Secrets
- Frontend: variables públicas con prefijo `NG_APP_` (accesibles en build de Angular)
- Backend: variables privadas — nunca en el frontend

## Convenciones generales

- IDs en UUID v4
- Fechas en ISO 8601 (`date-time`)
- Precios en EUR (float)
- Tallas en sistema EU (number)
- Paginación: `page` + `limit` → campo `meta` en respuesta
- Errores: esquema `ErrorResponse` / `ValidationErrorResponse`
- Imágenes de producto: subidas vía widget Cloudinary, backend recibe solo la URL
