-- Categories: user-defined, named groupings of Tasks, shown as columns in the Category row.
-- position is a fractional-indexing ordering key. It is collated "C" so the database sorts
-- by code unit, the same way the app compares keys (a locale collation would not).
-- The client picks the id so new Categories can show on screen before the insert returns.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  position text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_user_id_position_idx on public.categories (user_id, position);

alter table public.categories enable row level security;

create policy "Owners can read their categories"
  on public.categories for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can create their categories"
  on public.categories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can update their categories"
  on public.categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners can delete their categories"
  on public.categories for delete
  to authenticated
  using ((select auth.uid()) = user_id);
