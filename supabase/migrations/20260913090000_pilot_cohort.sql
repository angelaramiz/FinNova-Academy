-- Puerta de piloto Contalink (TASK-2-1, 2026-09-13, orden TPM).
-- Cohorte staff-gestionada: solo estos user_id ven las practicas Contalink.
-- NO APLICADA EN REMOTO (restriccion cero-prod del ciclo): la aplica
-- TPM/Dev Principal con el deploy. ASCII puro.
-- RLS: lectura propia (auth.uid() = user_id); staff opera con service role
-- (bypasea RLS) desde endpoints con requireSupabaseAuth.

CREATE TABLE IF NOT EXISTS public.pilot_cohort (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.pilot_cohort ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pilot_cohort_select_own ON public.pilot_cohort;
CREATE POLICY pilot_cohort_select_own ON public.pilot_cohort
  FOR SELECT USING (auth.uid() = user_id);
