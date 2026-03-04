-- goals table (id, user_id, title, deadline, priority, created_at)
-- RLS: user can only select/insert/update/delete own rows

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  deadline timestamptz,
  priority int,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_deadline_idx on public.goals(deadline);

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

create policy "goals_select_own"
  on public.goals
  for select
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals
  for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals
  for delete
  using (auth.uid() = user_id);
