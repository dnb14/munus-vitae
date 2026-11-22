## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded on each issue's `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the root plus ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Working on tickets

The v1 spec is `.scratch/munus-vitae-v1/spec.md`; its tickets are in `.scratch/munus-vitae-v1/issues/`.

1. **Pick** the lowest-numbered ticket whose `Blocked by` tickets all have `Status: done`, unless the user names one. Read the ticket and the spec sections it touches.
2. **Write tests first** at the one seam: render the whole app against the in-memory backend with the helpers in `src/test/renderApp.tsx` (`renderSignedIn`, `setToday`), query by role, label and text, and assert on the screen and on backend state. Run them and watch them go red.
3. **Build** until every test is green and `npm run build` passes. Data changes go through the `Backend` interface in both backends, with a new SQL file in `supabase/migrations/` for any schema change.
4. **Close out**: tick each acceptance criterion the work satisfies and set `Status: done`. Tell the user which parts only a human can check: anything touching Supabase (no automated tests cover it; new migrations must be run in the Supabase SQL editor) and how it looks.
5. **Commit and push only when the user says so.** Pushing to `master` deploys to Vercel.
