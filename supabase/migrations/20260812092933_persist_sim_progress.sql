-- Persistencia del progreso del simulador por usuario y especialidad.
-- Guarda las completaciones de tareas (TaskCompletion[]) como JSONB para que
-- el avance del alumno sobreviva reinicios y funcione multi-alumno.

CREATE TABLE IF NOT EXISTS public.sim_progress (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL CHECK (specialty IN ('accounting', 'data_engineering')),
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, specialty)
);

COMMENT ON TABLE public.sim_progress IS 'Progreso del simulador laboral por usuario y especialidad (lista de completaciones).';

ALTER TABLE public.sim_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sim_progress select" ON public.sim_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own sim_progress insert" ON public.sim_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own sim_progress update" ON public.sim_progress
    FOR UPDATE USING (auth.uid() = user_id);
