# Estándares de Codificación

Estas reglas aplican al código nuevo y a cualquier edición manual en `backend/`, `alumnos/`, `staff/` y `app/`.

## Principios generales

1. Preferir el patrón ya existente del repo antes que introducir nuevas capas.
2. Mantener los cambios acotados al módulo afectado.
3. No documentar o simular una feature como terminada si todavía es parcial.
4. Si una edición cambia comportamiento, revisar también la documentación de `agent_memory/`.

## TypeScript y React

1. Evitar `any` en código nuevo.
2. Reusar o extender tipos compartidos antes de duplicar estructuras.
3. En rutas Express usar `Request`, `Response`, `NextFunction` o `AuthenticatedRequest` cuando corresponda.
4. Validar payloads con `zod` en backend.
5. En React, manejar carga, error y estados vacíos cuando la UI depende de red.

## Backend

1. Mantener routers por dominio dentro de `backend/src/routes/`.
2. Si una ruta ya soporta Supabase y `MemoryDatabase`, no romper ese doble camino.
3. Respuestas de error deben incluir al menos:

```json
{
  "error": "Nombre",
  "message": "Detalle legible"
}
```

4. Logs manuales del servidor deben ser estructurados o claramente operativos.
5. Credenciales y secretos solo desde `process.env`.

## Frontend web

1. `alumnos/` y `staff/` son apps separadas; no asumir imports compartidos entre ambos.
2. Mantener la estética ya dominante:
   - fondos oscuros,
   - bordes `slate`,
   - acentos teal/indigo,
   - paneles tipo glass/dark.
3. Conservar consistencia visual con los componentes existentes antes de “modernizar” de forma aislada.
4. Los estados de autenticación por rol no deben relajarse en UI.

## Android

1. Mantener `Jetpack Compose` y `Material 3`.
2. Networking vía Retrofit/OkHttp.
3. Evitar mover lógica crítica a la UI si ya existe una abstracción en `api/` o `worker/`.

## Archivos y edición

1. ASCII por defecto.
2. Comentarios solo cuando aclaran algo no obvio.
3. Preservar comentarios útiles ya existentes.
4. No reordenar masivamente imports o estilos sin necesidad funcional.

## Documentación y trazabilidad

1. Si cambia arquitectura, actualizar:
   - `system_architecture.md`
   - `project_overview.md`
   - `tasks.md` si cambia backlog
   - `memory_logs.md` al cierre
2. Si cambian reglas de trabajo, actualizar también `protocol/` y `rules/`.
