# REPORTE DE SUGERENCIAS ESTRATEGICAS (2026-06-16)

Este reporte ha sido generado por el comando `/sugerencias` tras analizar la base de código actual del monorepo FinNova Academy (backend, alumnos, staff).

---

## ⚡ Corto Plazo (Bajo Esfuerzo / Alto Impacto)

### 1. Persistencia de Datos en Desarrollo (`memoryDb.json`)
*   **Problema**: Actualmente, `memoryDb.ts` mantiene todos los datos en memoria en tiempo de ejecución. Cada vez que el backend se reinicia (por recarga en caliente de `tsx` durante el desarrollo), todos los cursos nuevos, las preguntas de alumnos y las respuestas añadidas por el instructor se pierden, volviendo a los datos semilla.
*   **Solución**: Implementar una función de lectura y escritura automática a un archivo local `db.json` cada vez que se muten los arrays de `MemoryDatabase`.
*   **Justificación**: Facilita la consistencia en el flujo de desarrollo de múltiples portales (alumnos y staff interactuando simultáneamente).

### 2. Polling / Actualización en el Chat de Dudas
*   **Problema**: El chat estilo WhatsApp en `StudentDoubtsView` e `InstructorPanel` requiere que el usuario recargue manualmente la pantalla para ver nuevos mensajes o respuestas.
*   **Solución**: Implementar un polling simple (`setInterval` de 5-10 segundos) en los hooks de consulta de mensajes de los clientes de frontend, o un sistema ligero de SSE (Server-Sent Events) en el backend.
*   **Justificación**: Aumenta significativamente la interactividad de la UI (Rich Aesthetics) en el flujo de dudas.

---

## 🌀 Mediano Plazo (Esfuerzo Moderado)

### 1. Validación de Arranque en Servidor (`server.ts`)
*   **Problema**: Si el proyecto se despliega en producción (por ejemplo, en Render) sin configurar adecuadamente las variables de entorno de Supabase (como `SUPABASE_JWT_SECRET`), el servidor arrancará silenciosamente pero las llamadas autenticadas fallarán de manera ruidosa en tiempo de ejecución.
*   **Solución**: Agregar un validador en el arranque de Express que verifique si `process.env.SUPABASE_JWT_SECRET` está ausente o tiene valores por defecto cuando el entorno no permite mocks.
*   **Justificación**: Previene fallos silenciosos en despliegue.

### 2. Refactorización y Modularización de `VideoFeed.tsx`
*   **Problema**: El componente `VideoFeed` de alumnos se ha vuelto un archivo monolítico que maneja el reproductor, el feed de vídeos, la carga de datos, el modal de preguntas, y el renderizado y validación de ejercicios.
*   **Solución**: Separar el componente en partes manejables: `ExerciseOverlay.tsx`, `DoubtSubmitModal.tsx` y `TimelinePlayer.tsx`.
*   **Justificación**: Mejora el mantenimiento de código y reduce el peso de compilación del bundle principal de alumnos.

---

## 🚀 Largo Plazo (Esfuerzo Alto / Cambios Estructurales)

### 1. Migración Gradual de Base de Datos en Memoria a Supabase (PostgreSQL)
*   **Problema**: La base de datos en memoria no es escalable ni persistente para un entorno multiusuario de producción real.
*   **Solución**: Diseñar las consultas SQL y el esquema correspondiente en Supabase, y configurar el backend para utilizar consultas con Supabase Client en NodeJS en lugar de modificar los arrays estáticos de `MemoryDatabase`.
*   **Justificación**: Transición obligatoria para lanzar la aplicación al mercado real con múltiples instructores y estudiantes.

### 2. Integración de Pipelines de TTS y Vídeo con n8n
*   **Problema**: El pipeline de automatización está simulado para fines del sandbox.
*   **Solución**: Habilitar llamadas a webhooks reales en el workflow de n8n para renderizar los clips con voces de ElevenLabs y sincronización labial automática.
*   **Justificación**: Habilita la automatización real de la generación de contenido.
