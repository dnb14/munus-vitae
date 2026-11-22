# 02: Supabase, Google sign-in and Vercel deploy

**What to build:** I can open the deployed app on Vercel, sign in with my real Google account, and sign out. Setting up the accounts needs a human: create the Supabase project, create a Google OAuth client and connect it to Supabase Auth, and create the Vercel project with the environment variables for both. The agent part: a **Supabase backend** that implements the session part of the Backend interface, the first database migration (a **settings** table, one row per user, with row-level security so only the owner can access it), and wiring that picks the Supabase backend in the real app and the in-memory one in tests. Consider running `/wizard` to walk through the dashboard steps.

**Blocked by:** 01: Walking skeleton.

**Status:** ready-for-human

- [ ] Supabase project created; Google provider enabled with an OAuth client whose redirect URLs include localhost and the Vercel URL
- [ ] Vercel project created and connected to the GitHub repo, with the Supabase URL and anon key set as environment variables
- [ ] Database migrations live in the repo and can be applied to a fresh Supabase project
- [ ] The settings table exists (day_count 5–7 defaulting to 7, theme light/dark/null), with row-level security so only the owner can read or write their row
- [ ] The Supabase backend implements sign in with Google, sign out and current session; the app uses it outside tests
- [ ] Checked by hand: on the deployed URL, signing in with Google shows the page, reloading keeps me signed in, and Sign out works
