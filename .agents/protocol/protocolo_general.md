# Protocolo General de Agentes y Desarrollo

## Objetivo

Asegurar que cualquier cambio se haga contra el sistema real, preserve compatibilidad entre superficies y deje trazabilidad suficiente para el siguiente agente.

## Secuencia obligatoria

1. Leer `memory_logs.md`.
2. Revisar la parte afectada del código.
3. Confirmar impacto cruzado:
   - `backend/`
   - `alumnos/`
   - `staff/`
   - `app/`
   - `supabase/`
4. Actualizar o crear trabajo en `tasks.md` si cambia el backlog.
5. Implementar.
6. Verificar.
7. Registrar cierre en `memory_logs.md`.

## Reglas de ejecución

### 1. Investigar antes de tocar

- Buscar símbolos, rutas y archivos afectados.
- Si `.codegraph/` está presente, consultar CodeGraph primero para preguntas de estructura o impacto.

### 2. Respetar superficies separadas

- `alumnos/` y `staff/` no son el mismo frontend.
- `backend/` no debe asumir una sola UI consumidora.
- `app/` es un cliente adicional y puede requerir compatibilidad API.

### 3. Mantener la doble persistencia

Si una funcionalidad ya soporta Supabase y `MemoryDatabase`, mantener ambos caminos salvo instrucción explícita en sentido contrario.

### 4. Documentar cambios de verdad

Si la arquitectura, reglas o backlog cambian, actualizar los archivos de `agent_memory/` en la misma sesión.

### 5. No cerrar sin validación proporcional

- Cambios de docs: revisar consistencia y enlaces.
- Cambios de backend/frontend: al menos build/typecheck del área afectada.
- Cambios Android: compilación del módulo si el entorno lo permite.

## Criterio de calidad

Un cambio no está terminado si:

- rompe la separación por rol,
- deja desalineado el fallback local,
- actualiza código pero no memoria operativa,
- o describe como “real” algo que sigue simulado.
