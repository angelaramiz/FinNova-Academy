# CONFIGURACION CENTRAL DE AGENTES - AuraFi Academy

## Stack Tecnológico del Proyecto
*   **Backend**: Node.js, Express, TypeScript, tsx, base de datos simulada en memoria (`memoryDb.ts`).
*   **Frontend Alumnos**: React, Vite, TailwindCSS / Vanilla CSS, Supabase Client (Google OAuth).
*   **Frontend Staff**: React, Vite, TailwindCSS / Vanilla CSS, Supabase Client (Auth por Rol: admin, instructor).
*   **Base de Datos / Backend Real**: Supabase (PostgreSQL), n8n para automatizaciones.

## Comandos Disponibles
*   `/sugerencias`: Analiza código reciente, tareas y genera reportes en `agent_memory/suggestions/`.
*   `/reunion`: Inicia/finaliza una reunión estructurada usando las plantillas de `agent_memory/meetings/`.

## Reglas Básicas de Operación
1.  **No asumir**: Siempre verificar el estado local antes de proceder.
2.  **Planificación de Roles**: Generar `roles/plan-de-rol.md` antes de cualquier modificación compleja.
3.  **Memoria**: Sincronizar decisiones críticas en el historial.
4.  **Ahorro de Tokens**: Limitar la lectura de archivos innecesarios; usar resúmenes estructurados.
5.  **Separación de Lógica (Staff vs Alumnos)**: Toda la lógica de autenticación, formularios de registro, paneles y ruteo debe estar estrictamente separada. El portal de alumnos solo debe procesar y permitir acceso a usuarios con el rol `student`. El portal de staff solo debe procesar y permitir acceso a usuarios con los roles `instructor` y `admin`.

