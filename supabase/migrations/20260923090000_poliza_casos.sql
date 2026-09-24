-- Catálogo de casos de operación para el Sim de Pólizas (Anexo 24).
-- Fuente de verdad: backend/src/data/polizaDataset.ts (21 filas CFDI↔banco).
-- El servicio auto-siembra la tabla si está vacía (idempotente por uuid_cfdi),
-- así local (memoria) y prod (Supabase) siempre ven los mismos casos.

CREATE TABLE IF NOT EXISTS public.poliza_casos (
    uuid_cfdi TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('gasto', 'ingreso', 'capital')),
    cfdi JSONB NOT NULL,
    edo JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.poliza_casos IS 'Casos de operación del Sim de Pólizas: 21 filas CFDI con su banco (PUE) o promesa (PPD).';

ALTER TABLE public.poliza_casos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casos lectura alumnos" ON public.poliza_casos
    FOR SELECT USING (true);

CREATE POLICY "casos siembra servicio" ON public.poliza_casos
    FOR INSERT WITH CHECK (true);
