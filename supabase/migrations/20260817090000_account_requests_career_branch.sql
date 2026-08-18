-- Registro de alumnos con selección de ruta del árbol data.
-- Permite que el formulario de registro guarde la rama elegida
-- (analyst | engineering | science) para precargarla en el mundo simulado.

ALTER TABLE public.account_requests
  ADD COLUMN IF NOT EXISTS career_branch TEXT DEFAULT NULL
  CHECK (career_branch IN ('analyst', 'engineering', 'science'));
