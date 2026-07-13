# CONFIGURACION CENTRAL DE AGENTES - AuraFi Academy

## Stack Tecnológico del Proyecto
*   **Backend**: Node.js, Express, TypeScript, tsx, base de datos simulada en memoria (`memoryDb.ts`) + Supabase (PostgreSQL).
*   **Frontend Alumnos**: React, Vite, TailwindCSS, puerto 3000.
*   **Frontend Staff**: React, Vite, TailwindCSS, puerto **3001**.
*   **Base de Datos**: Supabase (PostgreSQL), migraciones en `supabase/`.
*   **Infra**: Render (3 servicios: backend, alumnos, staff).

## Comandos Disponibles
*   `/sugerencias`: Analiza código reciente, tareas y genera reportes en `agent_memory/suggestions/`.
*   `/reunion`: Inicia/finaliza una reunión estructurada usando las plantillas de `agent_memory/meetings/`.
*   `/protocol`: Audita el código frente a los lineamientos de desarrollo y seguridad en `agent_memory/protocol/`.

## Cambios Recientes (2026-07-13)

### Seguridad
- Claves expuestas rotadas (Supabase service role, anon key, Gemini API key)
- `.env.local` en `.gitignore` (raíz, `alumnos/`, `staff/`)
- `SUPABASE_JWT_SECRET` ya no tiene fallback inseguro: sin configurar, lanza error
- `ENABLE_DOCKER_MOCKS` solo se activa con `'true'` explícito, no por ausencia
- `Math.random()` reemplazado por `crypto.randomBytes()` y `crypto.randomInt()` en generación de passwords y OTPs
- Helmet agregado como middleware de seguridad HTTP
- CORS endurecido: `includes()` exacto en vez de `startsWith()`
- Rate limiter con limpieza periódica cada 5 minutos

### Base de Datos
- Tablas `profiles`, `allowed_emails`, `account_requests`, `email_queue` añadidas a `schema.sql`
- 5 migraciones SQL sueltas fusionadas en `schema.sql`
- `seed.sql` corregido a snake_case (consistente con `schema.sql`)
- Proyecto Supabase unificado: `nhcgclqiihvioyqwqjlf.supabase.co`

### Testing
- Vitest configurado (`vitest.config.ts`)
- Tests de MemoryDatabase
- Supertest para tests de API REST
- **9 tests pasando**

### Dependencias
- `ffmpeg-static`, `multer`, `helmet` agregados a `package.json`
- `vitest`, `supertest`, `@types/supertest` como devDependencies

### Infraestructura
- `.gitignore` ya no excluye `backend/`, `staff/`, `supabase/`, `app/`
- `staff/` usa puerto 3001 (no compite con `alumnos/` 3000)
- Archivo LICENSE (Apache-2.0) agregado

## Reglas Básicas de Operación
1.  **No asumir**: Siempre verificar el estado local antes de proceder.
2.  **Planificación de Roles**: Generar `roles/plan-de-rol.md` antes de cualquier modificación compleja.
3.  **Memoria**: Sincronizar decisiones críticas en el historial.
4.  **Ahorro de Tokens**: Limitar la lectura de archivos innecesarios; usar resúmenes estructurados.
5.  **Separación de Lógica (Staff vs Alumnos)**: Toda la lógica de autenticación, formularios de registro, paneles y ruteo debe estar estrictamente separada. El portal de alumnos solo debe procesar y permitir acceso a usuarios con el rol `student`. El portal de staff solo debe procesar y permitir acceso a usuarios con los roles `instructor` y `admin`.

## Protocolo de Desarrollo

### Protocolos Obligatorios
- **Análisis Completo**: Identificar todas las referencias afectadas (estructuras de datos, UI, APIs, scanners, reportes).
- **Descomposición Jerárquica**: Dividir cada requerimiento en tareas atómicas siguiendo el flujo: Análisis ➔ Investigación ➔ Implementación ➔ Validación.
- **Investigación Automática**: Buscar archivos, componentes y funciones que referencien los elementos modificados.
- **Trazabilidad**: Indicar qué archivos/componentes afecta cada tarea en `tasks.md`.

### Reglas de Ejecución
1. **Antes de codificar**: Generar la lista completa de archivos/componentes afectados en `tasks.md`.
2. **Priorización**: Ordenar tareas por dependencias (primero estructura de datos, luego UI, luego integraciones).
3. **Migración**: Si cambias la estructura de datos, incluir script de migración en la base de datos (`schema.sql`).
4. **Testing**: Verificar la integridad compilando localmente y realizando pruebas correspondientes. `npm run test` debe pasar antes de commitear.
5. **Documentación**: Mantener actualizado este archivo `agents.md` con los cambios arquitectónicos importantes.

## Tests

```bash
npm run test        # ejecuta todos los tests (9)
npm run test:watch  # modo watch durante desarrollo
```

Los tests usan `vitest` y `supertest`. No requieren conexión a Supabase ni base de datos externa.

