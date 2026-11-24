# 12: Visual redesign

**What to build:** A calmer, more modern look that keeps the minimal feel. Styling and layout only: no data or behaviour changes apart from the bar split and Line height.

- **Feel:** calm neutral, like Things 3 or Linear. Near-white background, cool greys, hairline borders, one restrained accent.
- **Typeface:** **Inter**, bundled with the app (e.g. `@fontsource-variable/inter`, no Google Fonts request). Dates use tabular numbers.
- **Accent:** muted indigo `#5b5bd6`, used only for Today, focus rings and selected states (toggles, segmented control, primary buttons). It replaces the salmon `#fd8a8a`. Overdue red stays distinct from the accent.
- **Dark mode:** the same system. Background around `#111113`, slightly lighter column surfaces, low-contrast hairlines, accent lightened to around `#8b8bf0`.
- **Day column headers:** a large date number with a small, spaced, uppercase weekday ("24 TUE"). The full date stays as the column's accessible name.
- **Today:** an accent-coloured date number plus a small "Today" label. No filled bar.
- **Past days:** full opacity (not 45%), with a greyed header and a faint tinted background on the Lines area.
- **Category names:** 15px semibold in the main text colour. Category headers are the same height as Day column headers, so the rows line up.
- **Lines:** fainter hairlines, 32px tall (`LINE_HEIGHT` 28 → 32). Vertical column dividers stay, also fainter.
- **Between the rows:** a slightly stronger line plus a few pixels of space, with no row labels. Ticket 14 puts the Area tabs here.
- **Checkbox:** a custom round outline checkbox (still a real `<input type="checkbox">` for accessibility) that fills with the accent when Done. It still appears only on hover or focus.
- **Top bar** (44px):
  - left: a search box. Until ticket 13 it's a placeholder showing a faint "Search  /" hint.
  - centre: the logo, an indigo square mark with three ruled lines next to the wordmark "Munus Vitae" in Inter semibold. The mark is also the favicon.
  - right: avatar and Sign out.
- **Bottom bar** (44px):
  - left: the month and year of the Day row's start ("November 2026") in semibold.
  - then: icon arrow buttons for ‹‹ ‹ Today › ››.
  - right: the 5/6/7 choice as a segmented control, then a sun/moon icon theme toggle.
  - Everything is quiet grey until hovered. The active Tag with ✕ moves here until ticket 13 replaces it.
- **Rows:** the Day row keeps 60% of the height between the two bars and the Category row 40%. Columns keep their fixed width (window width ÷ day count).
- **Other surfaces** get Inter, an 8px radius, soft shadows and an indigo primary button:
  - the Task editor
  - the delete confirmation
  - the Category ⋯ menu
  - the "Couldn't save" notice
  - the sign-in page, which shows the logo above the Google button

**Blocked by:** none.

**Status:** done

- [x] Inter is bundled and used everywhere. No request goes to a font CDN.
- [x] The accent is indigo in light and dark themes, and no salmon remains
- [x] Day column headers show the big date number and small uppercase weekday. Today shows an accent number and a "Today" label.
- [x] Past days are at full opacity with a greyed header and tinted Lines
- [x] Category names are 15px semibold, and Category and Day headers are the same height
- [x] Lines are 32px with fainter rules
- [x] The Done checkbox is a round custom style that is still keyboard- and screen-reader-operable
- [x] The top bar has the search placeholder, logo and avatar/Sign out
- [x] The bottom bar has the month/year, navigation, 5/6/7 segmented control and theme toggle, all with accessible names
- [x] The logo is used as the favicon and on the sign-in page
- [x] The dialogs, menu, notice and sign-in page are restyled
- [x] Existing app-level tests still pass. Tests are updated for changed header text and button names, and they cover the "Today" label and the month/year in the bottom bar.
- [ ] Checked by eye in light and dark mode

## Comments

- Built and checked in headless Edge screenshots (light, dark, sign-in) against the in-memory backend. Still to check by eye in a real browser: Lines filling each column to the bottom, hover states (checkbox, Category handle and ⋯), dialogs and the ⋯ menu, and the favicon.
- The sign-in page gained a one-line tagline under the name: "Your days and everything else, on ruled paper."
- Follow-up changes asked for after review:
  - The top bar is removed, and the logo moves to the centre of the bottom bar.
  - Signing in and out moves to its own page at `/account`, reached by typing the address. The board has no account controls; signed out at `/`, the sign-in screen still shows. `vercel.json` rewrites every path to `index.html` so `/account` works when deployed.
  - There's no search bar. `/` with nothing focused, or Ctrl/⌘+K, opens a search box in the middle of the screen, and Esc closes it. Ticket 13 makes it filter.
  - Category names are 18px and centred. Task text is 13px.
- Further tweaks after review:
  - There are no vertical column rules, and horizontal rules are inset 12px from each column's edges.
  - The Category row is a shade greyer, and hovering a Category shades its whole column.
  - Category headers have no visible drag handle: the header itself drags, with an invisible keyboard handle. A small vertical ⋮ menu sits to the left of the name.
  - Category names have no underline, have space above and below, are left-aligned, and use **Outfit** (bundled) at 22px semibold.
  - Renaming a Category edits the name in place, with no box.
