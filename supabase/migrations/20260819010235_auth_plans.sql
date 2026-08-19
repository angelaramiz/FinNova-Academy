-- R-10 v2 T1: plans + densidad de experiencia en profiles
-- Columna plan (free|pro) para el límite de vacantes del plan free,
-- y experience_density para la Etapa 3 (densidad de experiencia).

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro'));

alter table public.profiles
  add column if not exists experience_density numeric not null default 0;

-- Tabla de seguimiento de vacantes (Etapa 2)
create table if not exists public.vacancy_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vacancy_id text not null,           -- id del análisis de Etapa 1
  stage1_result_id uuid,              -- referencia al assessment (si aplica)
  modo text default 'B' check (modo in ('A', 'B')),
  status text default 'diagnostico' check (status in ('diagnostico', 'preparacion', 'postulacion', 'entrevista', 'cerrada')),
  vacante_titulo text,
  vacante_stack text,
  match_pct numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, vacancy_id)
);

-- Tabla de assessments de Etapa 1 (resultados de diagnóstico)
create table if not exists public.stage1_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vacancy_text text not null,
  vacancy_skills jsonb,               -- [{skill, required, weight}]
  requires_experience boolean default false,
  match_pct numeric,
  match_breakdown jsonb,              -- {skill: {score, weight, contribution}}
  routing text check (routing in ('ETAPA_2_MODO_A', 'ETAPA_2_MODO_B', 'ETAPA_3')),
  answers jsonb,
  created_at timestamptz default now()
);

alter table public.vacancy_tracking enable row level security;
alter table public.stage1_assessments enable row level security;

create policy "vacancy_tracking_select_own" on public.vacancy_tracking for select using (auth.uid() = user_id);
create policy "vacancy_tracking_insert_own" on public.vacancy_tracking for insert with check (auth.uid() = user_id);
create policy "vacancy_tracking_update_own" on public.vacancy_tracking for update using (auth.uid() = user_id);
create policy "vacancy_tracking_delete_own" on public.vacancy_tracking for delete using (auth.uid() = user_id);

create policy "stage1_assessments_select_own" on public.stage1_assessments for select using (auth.uid() = user_id);
create policy "stage1_assessments_insert_own" on public.stage1_assessments for insert with check (auth.uid() = user_id);
create policy "stage1_assessments_update_own" on public.stage1_assessments for update using (auth.uid() = user_id);
create policy "stage1_assessments_delete_own" on public.stage1_assessments for delete using (auth.uid() = user_id);
