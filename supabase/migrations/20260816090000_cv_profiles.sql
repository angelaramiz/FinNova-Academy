-- CV Institucional: datos extra que el alumno llena para generar su
-- CV de egreso con marca (contacto, educación, idiomas, proyectos).

CREATE TABLE IF NOT EXISTS public.cv_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cv_profiles IS 'Datos extra del alumno para el CV de egreso con marca institucional.';

ALTER TABLE public.cv_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own cv_profiles select" ON public.cv_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own cv_profiles insert" ON public.cv_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own cv_profiles update" ON public.cv_profiles
    FOR UPDATE USING (auth.uid() = user_id);
