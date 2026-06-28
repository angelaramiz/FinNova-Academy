# CONFIGURACION CENTRAL DE AGENTES - AuraFi Academy

## Stack Tecnológico del Proyecto
*   **Backend**: Node.js, Express, TypeScript, tsx, base de datos simulada en memoria (`memoryDb.ts`).
*   **Frontend Alumnos**: React, Vite, TailwindCSS / Vanilla CSS, Supabase Client (Google OAuth).
*   **Frontend Staff**: React, Vite, TailwindCSS / Vanilla CSS, Supabase Client (Auth por Rol: admin, instructor).
*   **Base de Datos / Backend Real**: Supabase (PostgreSQL), n8n para automatizaciones.

## Comandos Disponibles
*   `/sugerencias`: Analiza código reciente, tareas y genera reportes en `agent_memory/suggestions/`.
*   `/reunion`: Inicia/finaliza una reunión estructurada usando las plantillas de `agent_memory/meetings/`.
*   `/protocol`: Audita el código frente a los lineamientos de desarrollo y seguridad en `agent_memory/protocol/`.

## Reglas Básicas de Operación
1.  **No asumir**: Siempre verificar el estado local antes de proceder.
2.  **Planificación de Roles**: Generar `roles/plan-de-rol.md` antes de cualquier modificación compleja.
3.  **Memoria**: Sincronizar decisiones críticas en el historial.
4.  **Ahorro de Tokens**: Limitar la lectura de archivos innecesarios; usar resúmenes estructurados.
5.  **Separación de Lógica (Staff vs Alumnos)**: Toda la lógica de autenticación, formularios de registro, paneles y ruteo debe estar estrictamente separada. El portal de alumnos solo debe procesar y permitir acceso a usuarios con el rol `student`. El portal de staff solo debe procesar y permitir acceso a usuarios con los roles `instructor` y `admin`.

## Estructuración de Tareas y Desarrollo (Protocolo input.md)

### Protocolos Obligatorios
- **Análisis Completo**: Identificar todas las referencias afectadas (estructuras de datos, UI, APIs, scanners, reportes).
- **Descomposición Jerárquica**: Dividir cada requerimiento en tareas atómicas siguiendo el flujo: Análisis ➔ Investigación ➔ Implementación ➔ Validación.
- **Investigación Automática**: Buscar archivos, componentes y funciones que referencien los elementos modificados.
- **Trazabilidad**: Indicar qué archivos/componentes afecta cada tarea en `tasks.md`.

### Skills del Agente
- **Rastreo de dependencias**: Identificar dónde se usa cada campo/función/módulo.
- **Refactorización transversal**: Actualizar consistentemente todas las referencias de manera coordinada.
- **Validación de integridad**: Verificar que los cambios no rompan funcionalidad existente ni lógicas de roles separadas.
- **Documentación automática**: Mantener actualizados comentarios y documentación técnica.

### Reglas de Ejecución Adicionales
1. **Antes de codificar**: Generar la lista completa de archivos/componentes afectados en `tasks.md`.
2. **Priorización**: Ordenar tareas por dependencias (primero estructura de datos, luego UI, luego integraciones).
3. **Migración**: Si cambias la estructura de datos, incluir script de migración en la base de datos (por ejemplo, `schema.sql`).
4. **Testing**: Verificar la integridad compilando localmente y realizando pruebas correspondientes.
5. **Documentación**: Mantener actualizado este archivo `agents.md` con los cambios arquitectónicos importantes.

