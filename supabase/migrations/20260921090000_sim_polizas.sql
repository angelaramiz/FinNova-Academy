-- Persistencia de pólizas del motor de asientos (Anexo 24 sección C).
-- Cada póliza guardada desde PolizaSim conserva header fiscal + líneas con
-- código agrupador SAT para que sobreviva reinicios y alimente la balanza.

CREATE TABLE IF NOT EXISTS public.sim_polizas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    folio TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('PROVISION', 'EGRESOS', 'DIARIO')),
    concepto TEXT NOT NULL,
    uuid_cfdi TEXT,
    rfc_tercero TEXT,
    monto_total NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    metodo_pago TEXT,
    banco TEXT,
    lineas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sim_polizas IS 'Pólizas del periodo (Anexo 24 C) generadas por el motor de asientos.';

ALTER TABLE public.sim_polizas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sim_polizas select" ON public.sim_polizas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own sim_polizas insert" ON public.sim_polizas
    FOR INSERT WITH CHECK (auth.uid() = user_id);
