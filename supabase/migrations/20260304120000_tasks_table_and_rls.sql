-- tasks table: id, user_id, goal_id (fk -> goals), title, estimated_duration, priority, status, due_date, created_at
-- RLS: user can only CRUD own tasks; goal_id must be null or reference own goal

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  estimated_duration int,
  priority int,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'blocked')),
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_goal_id_idx on public.tasks(goal_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_due_date_idx on public.tasks(due_date);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
  on public.tasks
  for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks
  for insert
  with check (
    auth.uid() = user_id
    and (
      goal_id is null
      or exists (
        select 1 from public.goals g
        where g.id = goal_id and g.user_id = auth.uid()
      )
    )
  );

create policy "tasks_update_own"
  on public.tasks
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      goal_id is null
      or exists (
        select 1 from public.goals g
        where g.id = goal_id and g.user_id = auth.uid()
      )
    )
  );

create policy "tasks_delete_own"
  on public.tasks
  for delete
  using (auth.uid() = user_id);
