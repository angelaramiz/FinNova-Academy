# Sistema de Memoria de Agentes

`agent_memory/` es la fuente de contexto operativo del proyecto. Su función no es describir una idea abstracta del producto, sino dejar claro cómo está construido hoy, qué reglas lo gobiernan y qué trabajo queda pendiente.

## Estado actual del repositorio

La arquitectura viva del proyecto ya no es el monolito inicial. Hoy el repo está dividido en cuatro superficies principales:

1. `backend/`: API Express/TypeScript compartida.
2. `alumnos/`: portal web para estudiantes en React + Vite.
3. `staff/`: portal web para instructores y administradores en React + Vite.
4. `app/`: app Android nativa en Kotlin/Jetpack Compose para administración.

Además existen `supabase/` para esquema y seed, `workflown8n/` para material del flujo automatizado y `.codegraph/` para soporte de navegación de código local.

## Qué leer primero

1. [`memory_logs.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/memory_logs.md)
   Estado reciente, sesiones previas y decisiones vivas.
2. [`project_overview.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/project_overview.md)
   Dominio del producto, actores y entidades.
3. [`system_architecture.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/system_architecture.md)
   Mapa técnico real del backend, frontends y app Android.
4. [`coding_standards.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/coding_standards.md)
   Reglas de implementación y edición.
5. [`development_workflows.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/development_workflows.md)
   Cómo levantar, probar y validar el sistema.

## Protocolo operativo obligatorio

### Antes de trabajar

1. Leer `memory_logs.md`.
2. Leer `coding_standards.md`.
3. Confirmar en código la parte afectada del sistema.
4. Si `.codegraph/` existe, consultar CodeGraph antes de una exploración amplia.

### Durante el trabajo

1. Mantener coherencia entre `backend/`, `alumnos/`, `staff/` y `app/` cuando una funcionalidad cruza capas.
2. Si una ruta backend soporta Supabase y fallback local, conservar ambos caminos.
3. No documentar capacidades no implementadas como si ya fueran reales.

### Al cerrar la sesión

1. Actualizar [`memory_logs.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/memory_logs.md).
2. Actualizar `tasks.md` si cambió el backlog o el estado del trabajo.
3. Ajustar `input.md` si la sesión cerró un objetivo o abrió uno nuevo.

## Lectura por intención

- Arquitectura y límites: [`protocol/desarrollo.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/protocol/desarrollo.md)
- Seguridad y roles: [`protocol/seguridad.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/protocol/seguridad.md)
- Comandos internos de operación: [`commands/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/commands/)
- Roles de trabajo: [`roles/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/roles/)
- Reglas resumidas: [`rules/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/rules/)
