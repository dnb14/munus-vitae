-- Let signed-in users reach the tables through the Data API.
-- Row level security decides which rows they see; these grants let the
-- authenticated role touch the tables at all. Newer Supabase projects do not
-- grant this by default, so without it every request fails with 403.

grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
