# Flujo del Comando `/protocol`

## `/protocol verificar`

Debe revisar contra `protocol/` y `rules/` al menos:

- separación por roles,
- compatibilidad Supabase/fallback,
- impacto cruzado entre `backend/`, `alumnos/`, `staff/` y `app/`,
- necesidad de actualizar documentación viva.

## `/protocol actualizar`

Debe actualizar la regla afectada en:

- `protocol/` si cambia el flujo obligatorio,
- `rules/` si cambia una convención resumida,
- `memory_logs.md` si la decisión ya quedó adoptada.
