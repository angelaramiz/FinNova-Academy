-- R-07: Árbol de Rutas de la especialidad Data
-- career_path (estado del árbol de rutas por usuario) + breakdown
-- (desglose de práctica tasks/sims/cases) para la métrica practicePct.

ALTER TABLE public.sim_world
  ADD COLUMN IF NOT EXISTS career_path JSONB DEFAULT NULL;

ALTER TABLE public.sim_progress
  ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT NULL;
