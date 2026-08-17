-- ============================================================
-- MIGRACIONES PENDIENTES — Simulador Laboral (proyecto activo)
-- Proyecto: nhcgclqiihvioyqwqjlf
-- Pega este script completo en el SQL Editor de Supabase y ejecútalo.
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- ── 1. P2-14: columna specialty en profiles ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT 'accounting'
  CHECK (specialty IN ('accounting', 'data_engineering'));

-- ── 2. R-07: columna career_path en sim_world + breakdown ──
ALTER TABLE public.sim_world
  ADD COLUMN IF NOT EXISTS career_path JSONB DEFAULT NULL;

ALTER TABLE public.sim_progress
  ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT NULL;

-- ── 3. CV Institucional: tabla cv_profiles ──────────────────
CREATE TABLE IF NOT EXISTS public.cv_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cv_profiles IS 'Datos extra del alumno para el CV de egreso con marca institucional.';

ALTER TABLE public.cv_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own cv_profiles select" ON public.cv_profiles;
CREATE POLICY "own cv_profiles select" ON public.cv_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own cv_profiles insert" ON public.cv_profiles;
CREATE POLICY "own cv_profiles insert" ON public.cv_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own cv_profiles update" ON public.cv_profiles;
CREATE POLICY "own cv_profiles update" ON public.cv_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- VERIFICACIÓN (opcional): corre y revisa que no haya errores
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='profiles' AND column_name='specialty') AS profiles_specialty,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='sim_world' AND column_name='career_path') AS sim_world_career_path,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='sim_progress' AND column_name='breakdown') AS sim_progress_breakdown,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='cv_profiles') AS cv_profiles_exists;
