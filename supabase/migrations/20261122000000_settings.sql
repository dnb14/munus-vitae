-- Per-user display settings: how many Day columns to show, and the theme.
-- theme is null until the user first presses the theme toggle (null = follow the system).

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  day_count smallint not null default 7 check (day_count between 5 and 7),
  theme text check (theme in ('light', 'dark')),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Owners can read their settings"
  on public.settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can create their settings"
  on public.settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can update their settings"
  on public.settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners can delete their settings"
  on public.settings for delete
  to authenticated
  using ((select auth.uid()) = user_id);
