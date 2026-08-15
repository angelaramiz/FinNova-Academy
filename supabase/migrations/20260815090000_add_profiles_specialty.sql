-- P2-14: Especialidad del alumno persistida en profiles
-- El onboarding selecciona Contabilidad o Data Engineering; la especialidad
-- debe persistir en profiles para que el simulador monte el entorno correcto
-- (apps, tareas y puesto) al volver a entrar.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT 'accounting'
  CHECK (specialty IN ('accounting', 'data_engineering'));
