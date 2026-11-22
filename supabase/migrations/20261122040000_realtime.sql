-- Live sync: send every change to these tables to subscribed clients through
-- Supabase Realtime. Realtime applies each table's row-level security, so a
-- user only receives changes to their own rows (deletes carry just the id).

alter publication supabase_realtime add table public.settings, public.categories, public.tasks;
