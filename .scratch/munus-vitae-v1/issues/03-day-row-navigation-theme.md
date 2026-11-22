# 03: Day row, navigation and theme toggle

**What to build:** The Day row shows my chosen number of Day columns (5, 6 or 7), starting at Today on every page load. Each header reads like "Mon 23"; Today's is highlighted in #FD8A8A and Past days are dimmed. The top bar has, in this order: « ◀ Today ▶ » (±7 days, ±1 day, back to Today), the 5 6 7 buttons (the active one highlighted) and a single theme toggle. My day count and theme are saved to my account settings. The theme follows my system's light/dark setting until I first press the toggle; after that the saved choice wins.

**Blocked by:** 02: Supabase, Google sign-in and Vercel deploy.

**Status:** ready-for-agent

- [ ] The Backend interface can load and update Settings (day_count, theme), in both the in-memory and Supabase backends
- [ ] The Day row shows day_count consecutive Day columns starting at Today on load; Today is the device's local date
- [ ] Headers show weekday and date; Today highlighted with the accent; Past days dimmed
- [ ] ◀/▶ move the start by 1 day, «/» by 7 days whatever the day count, and Today resets it
- [ ] Clicking 5/6/7 changes the number of Day columns straight away and saves it; reloading keeps it
- [ ] The theme follows the system while the saved theme is null; the toggle switches light/dark and saves the choice, which then wins over the system
- [ ] App-level tests with a faked clock cover: opening at Today, ±1, ±7, Today reset, 5/6/7 switching and saving, header text, and the theme toggle being saved
