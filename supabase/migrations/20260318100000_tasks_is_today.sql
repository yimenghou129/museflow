-- Add is_today flag to tasks for manual Today Top3 selection

alter table public.tasks
  add column if not exists is_today boolean not null default false;

-- If you previously used is_top3, initialize is_today with it (best-effort)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'is_top3'
  ) then
    update public.tasks
    set is_today = true
    where is_top3 = true;
  end if;
end $$;

-- Enforce: at most 3 tasks per user can have is_today=true
with ranked as (
  select
    id,
    user_id,
    row_number() over (partition by user_id order by created_at asc) as rn
  from public.tasks
  where is_today = true
)
update public.tasks t
set is_today = false
from ranked r
where t.id = r.id
  and r.rn > 3;

create index if not exists tasks_is_today_idx on public.tasks(is_today);

