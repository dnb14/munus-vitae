-- Tasks: single to-do items. Each lives in exactly one place: a day (day set) or a
-- Category (category_id set). Deleting a Category deletes its Tasks.
-- position is a fractional-indexing ordering key within the Task's place, collated "C"
-- so the database sorts by code unit, the same way the app compares keys.
-- The client picks the id so new Tasks can show on screen before the insert returns.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  notes text,
  deadline date,
  tags text[] not null default '{}',
  done boolean not null default false,
  done_at timestamptz,
  day date,
  category_id uuid references public.categories (id) on delete cascade,
  position text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_exactly_one_place check ((day is null) <> (category_id is null))
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_category_id_idx on public.tasks (category_id);

alter table public.tasks enable row level security;

create policy "Owners can read their tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A Task may only be put in a Category its owner also owns.
create policy "Owners can create their tasks"
  on public.tasks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid()))
    )
  );

create policy "Owners can update their tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid()))
    )
  );

create policy "Owners can delete their tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);
