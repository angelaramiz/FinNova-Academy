# Descripción General del Proyecto

`academicFinace` es una plataforma de educación financiera con operación multi-superficie. El sistema combina aprendizaje en clips cortos, ejercicios evaluados, gestión académica de cuentas y una capa administrativa separada.

## Superficies activas del producto

### 1. Portal de alumnos

- Inicio de sesión para perfiles `student`.
- Consumo de cursos y clips aprobados.
- Seguimiento de progreso por clip y curso.
- Resolución de ejercicios con retroalimentación y puntos.
- Utilidades extra visibles en UI, como exportación de CV y laboratorio/simuladores.

### 2. Portal de staff

- Inicio de sesión para perfiles `instructor` y `admin`.
- Panel de instructores para:
  - gestionar cursos y clips,
  - responder dudas de alumnos,
  - revisar items de pipeline.
- Panel de administración para:
  - aprobar o rechazar solicitudes de cuenta,
  - administrar correos permitidos,
  - revisar usuarios y cambiar rol/KYC,
  - operar recuperación de acceso.

### 3. App Android administrativa

- Login de administradores.
- Verificación OTP.
- Gestión de solicitudes de registro.
- Polling con WorkManager para notificaciones de nuevas solicitudes.

## Actores del sistema

### `student`

- Consume cursos publicados.
- Completa clips y ejercicios.
- Acumula `pointsEarned`.
- Puede generar preguntas para instructores.

### `instructor`

- Crea y edita cursos.
- Gestiona clips, estructura y material.
- Responde preguntas de estudiantes.
- Revisa pipelines automatizados.

### `admin`

- Aprueba cuentas y restablecimientos.
- Administra el directorio de correos permitidos.
- Puede mutar roles y estados de verificación.
- Opera desde web y desde Android.

## Modelo de datos operativo

El proyecto funciona en dos modos:

1. Supabase/Postgres cuando hay credenciales reales.
2. `MemoryDatabase` en [`backend/src/lib/memoryDb.ts`](file:///c:/Users/angel/Desktop/academicFinace/backend/src/lib/memoryDb.ts) como sandbox y fallback local.

El esquema persistente base vive en [`supabase/schema.sql`](file:///c:/Users/angel/Desktop/academicFinace/supabase/schema.sql).

## Entidades importantes

### `profiles`

- Identidad del usuario.
- Rol: `student`, `instructor`, `admin`.
- Puntos de gamificación.
- En el flujo actual también se usan campos operativos como OTP y `mustChangePassword`.

### `allowed_emails`

- Directorio de cuentas autorizadas.
- Se usa en altas controladas por administración.
- Relaciona email, nombre y rol esperado.

### `account_requests`

- Solicitudes de alta y solicitudes de recuperación de acceso.
- Estados: `pending`, `approved`, `rejected`.
- En la práctica soporta también casos especiales como `PASSWORD_RESET`.

### `courses`

- Unidad principal de agrupación académica.
- Incluye dificultad, categoría, ruta de aprendizaje y publicación.

### `clips`

- Lecciones individuales asociadas a un curso.
- Incluyen URL de video, duración, orden, sección y formato.
- El estado operativo visible es `draft`, `reviewing`, `approved`.

### `exercises`

- Evaluaciones ligadas a clips.
- Tipos: `multiple_choice`, `formula`, `ratio_calculation`, `portfolio_weight`.
- Pueden usar rúbricas para evaluación híbrida.

### `exercise_attempts`

- Historial de intentos por estudiante.
- Guarda score, tipo de evaluación y feedback.

### `user_progress`

- Registro de visualización y completitud por clip.
- Alimenta el porcentaje de avance del curso.

### `pipeline_reviews`

- Cola/revisión de materiales generados o simulados por pipeline.
- Estados: `pending_ingredients`, `tts_generated`, `video_composited`, `awaiting_approval`, `approved`, `rejected`.

### `student_questions`

- Canal de preguntas de alumno hacia instructor.
- Incluye reply opcional y timestamps de respuesta.

## Situación real del proyecto

La documentación antigua describía una única SPA con backend embebido en Vite. El estado real ya no es ese: el backend está separado, hay dos frontends web independientes y existe una app Android de administración. Toda nueva documentación debe partir de esa realidad.
