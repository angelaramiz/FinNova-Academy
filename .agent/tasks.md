# Tareas — AuraFi Academy / FinNova Academy

## Pendientes

### 🔴 Crítico

- [x] **T001** Rotar todas las claves expuestas (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, N8N_WEBHOOK_SECRET) y actualizar .env
- [ ] **T002** Agregar `.env.local` a `.gitignore` en raíz, `alumnos/` y `staff/` y remover del tracking con `git rm --cached`
- [ ] **T003** Reemplazar JWT secret hardcodeado por `SUPABASE_JWT_SECRET` del entorno, sin fallback inseguro
- [ ] **T004** Revisar `ENABLE_DOCKER_MOCKS` para que en producción no pueda bypassear autenticación

### 🟡 Alto

- [x] **T005** Fusionar las 5 migraciones SQL sueltas en `supabase/schema.sql`:
  - `migration_account_tables.sql`
  - `migration_clips_video_format.sql`
  - `migration_courses_category.sql`
  - `migration_email_queue.sql`
  - `migration_pipeline_reviews.sql`
- [c] **T006** Crear `backend/Dockerfile` — **cancelada**: Render despliega sin Docker
- [x] **T007** Unificar proyectos Supabase: frontends corregidos a `nhcgclqiihvioyqwqjlf` (faltan las anon keys nuevas rotadas)
- [x] **T008** Homogeneizar `schema.sql` (snake_case) con `seed.sql` (camelCase) para que coincidan las columnas
- [x] **T009** Configurar suite de tests (Vitest) — 4 tests de MemoryDatabase pasando correctamente

### 🟠 Medio

- [x] **T010** Reemplazar `Math.random()` por `crypto.randomBytes()` / `crypto.randomInt()` en generación de passwords y OTPs (se mantiene bcryptjs por compatibilidad nativa)
- [x] **T011** Agregar limpieza periódica al rate limiter en memoria (`ipRequestCounts`) — cada 5 minutos
- [x] **T012** Endurecer CORS: `ALLOWED_ORIGINS.includes()` en vez de `origin.startsWith()`
- [x] **T013** Agregar `ffmpeg-static` y `multer` a `package.json`
- [x] **T014** staff → puerto 3001, alumnos → puerto 3000 (ya no compiten)
- [x] **T015** Revisar `.gitignore`: ya no excluye `backend/`, `staff/`, `supabase/`, `app/`

### 🔵 Bajo

- [x] **T016** helmet agregado como middleware de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- [x] **T017** Archivo LICENSE (Apache-2.0) agregado al repo
- [c] **T018** Actualizar `finmicro_edtech_pro_specs/` — **cancelada**: no refleja la arquitectura real, requiere reescritura completa fuera del alcance
- [c] **T019** Script dev fullstack — **cancelada**: el proyecto ya está deployado en Render, no necesario localmente
- [c] **T020** Guía de despliegue Render — **cancelada**: ya está deployado y funcionando
- [c] **T021** CHANGELOG — **cancelada**: bajo valor para el estado actual del proyecto

## En Progreso

*(ninguna)*

## Completadas

- [x] **T002** `.gitignore` verificado + scripts con claves hardcodeadas agregados al ignore (`test-db.js`, `queue-pending-credentials.js`, `run-email-queue-migration.mjs`)
- [x] **T003** JWT secret sin fallback inseguro — ahora requiere `SUPABASE_JWT_SECRET` en el entorno, lanza error si no está configurado
- [x] **T004** `ENABLE_DOCKER_MOCKS` ahora es seguro por defecto: solo activa si el valor es literal `'true'`, no por ausencia
- [x] **T001** `.env.example` actualizado con `SUPABASE_JWT_SECRET` y `ENABLE_DOCKER_MOCKS=false` por defecto
