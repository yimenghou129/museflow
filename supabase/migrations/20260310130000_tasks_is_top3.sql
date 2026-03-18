-- Add is_top3 flag to tasks to support Today Top3 selection

alter table public.tasks
  add column if not exists is_top3 boolean not null default false;

create index if not exists tasks_is_top3_idx on public.tasks(is_top3);

