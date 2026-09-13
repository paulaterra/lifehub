
create table if not exists public.lifehub_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lifehub_state enable row level security;

revoke all on table public.lifehub_state from anon, authenticated;
grant select, insert, update, delete on table public.lifehub_state to authenticated;

drop policy if exists "LifeHub select own row" on public.lifehub_state;
create policy "LifeHub select own row"
on public.lifehub_state
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "LifeHub insert own row" on public.lifehub_state;
create policy "LifeHub insert own row"
on public.lifehub_state
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "LifeHub update own row" on public.lifehub_state;
create policy "LifeHub update own row"
on public.lifehub_state
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "LifeHub delete own row" on public.lifehub_state;
create policy "LifeHub delete own row"
on public.lifehub_state
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
