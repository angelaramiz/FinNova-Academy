-- R-11: Flywheel de datos reales — capa transversal de calidad.
-- Telemetría anonimizada, agregados, misconceptions, tickets de mejora y
-- outcomes consentidos. user_hash es irreversible; NUNCA se guarda PII.
-- NOTA: la tabla se llama quality_events (sim_events ya existe como event
-- scheduler del mundo en supabase/schema.sql).

-- 1) Telemetría cruda sin PII
create table if not exists public.quality_events (
  id bigserial primary key,
  user_hash text not null,              -- hash irreversible (sha256 del userId + salt)
  stage int not null default 0,         -- 0..4 (mercado, diagnóstico, simulador, experiencia, resultados)
  type text not null,                   -- task_fail | trap_missed | hint_used | question_answered | case_regen | outcome | ...
  ref jsonb not null default '{}'::jsonb,  -- {taskId, skillId, questionId, caseSeed, vacancyId}
  data jsonb not null default '{}'::jsonb,  -- respuesta incorrecta (anonimizada), tiempo, reintentos
  ts timestamptz default now()
);
create index if not exists quality_events_type_idx on public.quality_events (type);
create index if not exists quality_events_stage_idx on public.quality_events (stage);

-- 2) Agregados por tarea/pregunta
create table if not exists public.item_stats (
  ref_id text primary key,              -- taskId | questionId | skillId
  attempts int not null default 0,
  fail_rate real not null default 0,
  avg_time_s int not null default 0,
  learning_gain real not null default 0,
  discrimination real not null default 0,
  updated_at timestamptz default now()
);

-- 3) Patrones de error reales (misconceptions)
create table if not exists public.misconceptions (
  id bigserial primary key,
  skill_id text not null,
  pattern text not null,                -- descripción del error
  example_anon text,                    -- ejemplo anonimizado de respuesta incorrecta
  frequency int not null default 0,
  feedback_propuesto text,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado', 'desplegado')),
  ref jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4) Cola de mejora (gate humano: abierto → aprobado → desplegado)
create table if not exists public.improvement_tickets (
  id bigserial primary key,
  origen text not null,                 -- task | trampa | drill | pregunta | feedback | ruta
  severidad text default 'media' check (severidad in ('baja', 'media', 'alta')),
  descripcion text not null,
  ref jsonb default '{}'::jsonb,
  status text not null default 'abierto' check (status in ('abierto', 'aprobado', 'rechazado', 'desplegado')),
  resuelto_por text,
  created_at timestamptz default now()
);

-- 5) Resultados reales con consentimiento explícito
create table if not exists public.outcome_tracking (
  user_hash text primary key,
  applied int not null default 0,
  interviews int not null default 0,
  hired boolean not null default false,
  skills_entrevista jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- RLS: los eventos se escriben por el backend (service role), los agregados
-- y tickets solo los lee staff. No hay acceso directo del cliente a PII.
alter table public.quality_events enable row level security;
alter table public.item_stats enable row level security;
alter table public.misconceptions enable row level security;
alter table public.improvement_tickets enable row level security;
alter table public.outcome_tracking enable row level security;

-- Solo staff (vía service role) lee/escribe; sin políticas para auth.uid()
-- para que el cliente no toque telemetría directamente. El backend usa el
-- service role y bypasea RLS.
