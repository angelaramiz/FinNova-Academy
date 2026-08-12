-- P2-9: Estado global del simulador DE persistente (sim_world)
-- El mundo simulado (incidente del 05-jul, SLAs, acciones) se guarda por
-- usuario para sobrevivir reinicios y funcionar multi-alumno en producción.

CREATE TABLE IF NOT EXISTS public.sim_world (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sim_world IS 'Mundo simulado del simulador DE: estado del pipeline, SLAs y acciones del usuario.';

ALTER TABLE public.sim_world ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sim_world select" ON public.sim_world
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own sim_world insert" ON public.sim_world
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own sim_world update" ON public.sim_world
    FOR UPDATE USING (auth.uid() = user_id);
