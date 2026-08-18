-- R-08 Fase 1: Links públicos de verificación del expediente.
-- El alumno genera un link con sello de verificación que comparte con
-- reclutadores; puede revocarlo cuando quiera.

CREATE TABLE IF NOT EXISTS public.verification_links (
    slug TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL DEFAULT 'accounting',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

COMMENT ON TABLE public.verification_links IS 'Links públicos verificables del expediente profesional del alumno.';

CREATE INDEX IF NOT EXISTS idx_verification_links_user ON public.verification_links (user_id);

ALTER TABLE public.verification_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own verification_links select" ON public.verification_links;
CREATE POLICY "own verification_links select" ON public.verification_links
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own verification_links insert" ON public.verification_links;
CREATE POLICY "own verification_links insert" ON public.verification_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own verification_links update" ON public.verification_links;
CREATE POLICY "own verification_links update" ON public.verification_links
    FOR UPDATE USING (auth.uid() = user_id);
