-- R-09 T6: tabla sim_story — estado del mundo vivo por usuario
-- (caso del día, arco activo, NPCs, crónica). Patrón de sim_world/sim_progress.
create table if not exists public.sim_story (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  arc_id text,
  scene_id text,
  status text default 'ready',
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sim_story enable row level security;

create policy "sim_story_select_own"
  on public.sim_story for select
  using (auth.uid() = user_id);

create policy "sim_story_insert_own"
  on public.sim_story for insert
  with check (auth.uid() = user_id);

create policy "sim_story_update_own"
  on public.sim_story for update
  using (auth.uid() = user_id);

create policy "sim_story_delete_own"
  on public.sim_story for delete
  using (auth.uid() = user_id);
