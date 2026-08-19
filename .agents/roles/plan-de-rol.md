# Plan de Rol Vigente

Este archivo resume cómo repartir trabajo por áreas en el estado actual del repo.

## Backend

- autenticación, OTP, recuperación y aprobación de cuentas,
- cursos, clips, ejercicios y progreso,
- pipeline, correo y webhooks,
- compatibilidad Supabase/fallback.

## Portal alumnos

- login y registro de estudiantes,
- experiencia de consumo, progreso y ejercicios,
- utilidades y estados visuales del alumno.

## Portal staff

- login staff,
- panel instructor para cursos, clips, preguntas y pipeline,
- panel admin para solicitudes, directorio y usuarios.

## Android

- flujo admin,
- OTP,
- solicitudes,
- notificaciones por polling.

## Regla de coordinación

Si una tarea toca contratos API usados por más de una superficie, el rol dominante debe actuar como coordinador y validar impacto en las demás.
