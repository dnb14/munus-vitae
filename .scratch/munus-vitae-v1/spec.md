# Spec: Munus Vitae v1

Status: ready-for-agent

## Problem Statement

I want one calm place to see what I'm doing on each of the next few days, next to everything else I need to do that isn't tied to a day: groceries, school work, and other things I group myself. Existing to-do apps are either a flat list with no sense of "which day", or a heavy calendar with too many fields and screens. I also need my list on any computer I sit at, always up to date.

## Solution

Munus Vitae is a minimal web app on a single page, split in two:

- The **Day row** (top 60%) shows 5, 6 or 7 Day columns starting at Today. I can scroll it through dates.
- The **Category row** (bottom 40%) shows one column per **Category** I create.

Every column is ruled into **Lines** like notebook paper. I click any empty Line and type to add a **Task**. Each Task lives in exactly one place, a Day column or a Category, and I drag it to move it. Unfinished Tasks from earlier days **Roll over** into Today automatically, while finished ones stay behind as history in **Past days**. Each Task can have a **Deadline**, **Notes** and **Tags**. I sign in with Google, and the app syncs live between every device I have it open on.

## User Stories

### Signing in and first use

1. As a user, I want to sign in with my Google account, so that I don't need another password.
2. As a user, I want to stay signed in between visits, so that opening the app takes me straight to my tasks.
3. As a user, I want to sign out from the top bar, so that I can leave a shared computer safely.
4. As a user, I want only my own data to be visible to me, so that my tasks stay private.
5. As a new user, I want my account to start with a **Groceries** Category (Milk, Eggs, Bread) and a **School** Category ("Read chapter 3", and "Finish problem set" with a Deadline 3 days after Today and the Tag `homework`), so that I can see how the app works straight away.
6. As a new user, I want the Day row to start empty, so that my days only contain what I've scheduled.
7. As a user, I want the starter Categories to be ordinary Categories, so that I can rename, edit or delete them like any other.

### Page layout

8. As a user, I want a really slim top bar, so that nearly the whole screen is for my tasks.
9. As a user, I want the Day row to take 60% of the height below the bar and the Category row 40%, so that my days get the most room.
10. As a user, I want highlights such as Today, the active day-count button and the active Tag to use the accent colour #FD8A8A, so that the app has one consistent look.
11. As a user, I want the app to start in my system's light or dark setting, so that it matches my computer.
12. As a user, I want a single theme toggle next to the 5/6/7 buttons, so that I can switch between light and dark.
13. As a user, I want my theme choice saved to my account once I've toggled it, so that every device shows the theme I picked.

### Day row

14. As a user, I want the Day row to open at Today, with Today as the leftmost Day column, so that I start each visit focused on now.
15. As a user, I want to choose 5, 6 or 7 days with simple buttons in the top bar, so that I control how far ahead I see.
16. As a user, I want my 5/6/7 choice saved to my account, so that it's the same on every device.
17. As a user, I want each Day column's header to show the weekday and date (e.g. "Mon 23"), so that I always know which date I'm looking at.
18. As a user, I want Today's header highlighted in the accent colour, so that I can find it at a glance.
19. As a user, I want ◀ and ▶ buttons that move the Day row one day at a time, so that I can look slightly ahead or back.
20. As a user, I want « and » buttons that move the Day row 7 days at a time, whether I'm showing 5, 6 or 7 days, so that I can jump through weeks quickly.
21. As a user, I want a Today button that returns the Day row to start at Today, so that I can get back after scrolling.
22. As a user, I want to scroll into future dates as far as I like, so that I can schedule Tasks weeks ahead.
23. As a user, I want Tasks on days hidden by a smaller 5/6/7 choice to be kept, so that shrinking the view never loses anything.

### Past days and Rollover

24. As a user, I want "Today" to be the date on the clock of the device I'm using, so that the app matches my local day.
25. As a user, I want every unfinished Task on a day before Today to move into Today automatically, so that nothing I haven't done gets forgotten.
26. As a user who hasn't opened the app for several days, I want unfinished Tasks from all those missed days to Roll over into Today, so that nothing is lost while I'm away.
27. As a user who leaves the app open overnight, I want Rollover to happen when the date changes, without reloading, so that the page is never showing yesterday as Today.
28. As a user, I want Rolled-over Tasks to go after Today's existing unfinished Tasks, keeping their relative order, so that what I'd already planned for Today stays on top.
29. As a user, I want Done Tasks to stay on the day they were in, so that Past days show what I got done.
30. As a user, I want to scroll back into Past days, so that I can see what I finished on an earlier date.
31. As a user, I want Past days to look dimmed, so that I can tell they're history.
32. As a user, I want Past days to be read-only (no adding, editing, ticking, unticking, or dragging in or out), so that my history stays accurate.

### Category row

33. As a user, I want one column per Category in the Category row, so that I can see all my groups side by side.
34. As a user, I want a "+ Add category" column at the right end of the Category row, so that I can create a new Category.
35. As a user, I want to click a Category's name and edit it in place, so that renaming is quick.
36. As a user, I want a ⋯ menu on each Category header with a Delete action, so that I can remove Categories I no longer need.
37. As a user, I want deleting a Category that has Tasks to ask "Delete <name> and its N tasks?" before deleting it and its Tasks, so that I don't lose tasks by accident.
38. As a user, I want to drag Category headers to reorder Categories, so that the ones I use most come first.
39. As a user, I want a "Clear done" action on each Category, so that I can remove finished Tasks from it.
40. As a user, I want to create as many Categories as I like and scroll the Category row sideways when they don't fit, so that I'm never limited.

### Lines and adding Tasks

41. As a user, I want every column ruled into Lines that fill its whole height, so that it looks and feels like notebook paper.
42. As a user, I want to click any empty Line and start typing, so that adding a Task is effortless.
43. As a user, I want a new Task to snap to the Line right after the last unfinished Task, wherever I clicked, so that columns never have gaps.
44. As a user, I want Enter to save the new Task, and Escape or leaving the Line empty to cancel it, so that adding is fast and mistakes are harmless.
45. As a user, I want to keep typing more Tasks after pressing Enter, so that I can write a whole list in one go.
46. As a user, I want a full column to scroll and always keep one empty Line at the bottom, so that I can always add another Task.

### Done

47. As a user, I want a Task's checkbox to appear only when I hover over it, so that the columns look clean.
48. As a user, I want ticking the checkbox to mark the Task Done, so that I can record progress.
49. As a user, I want Done Tasks to look crossed out and greyed even without hovering, so that I can tell what's finished at a glance.
50. As a user, I want Done Tasks to move below the unfinished Tasks in their column, so that what's left to do stays on top.
51. As a user, I want hovering over a Done Task to show its ticked checkbox, so that I can untick it.
52. As a user, I want unticking a Task to put it back at the end of the unfinished Tasks, so that a reopened Task is easy to find.

### Editing Tasks

53. As a user, I want clicking a Task's text to open a small editor, so that I can see and change its details.
54. As a user, I want to edit the Task's title in the editor, so that I can fix or reword it.
55. As a user, I want to set, change or clear a Deadline in the editor, so that I can record when the Task must be done.
56. As a user, I want to write Notes on a Task, so that I can keep extra details with it.
57. As a user, I want to add and remove Tags by typing them, with no separate screen for managing tags, so that tagging is quick.
58. As a user, I want a Delete button in the editor, so that I can remove a Task completely.
59. As a user, I want clicking a Task in a Past day to open its details read-only, so that I can look at old Notes without changing history.

### Deadlines

60. As a user, I want a Task with a Deadline to show a small date badge, so that I can see when it's due without opening it.
61. As a user, I want the badge to turn red once the Deadline has passed and the Task isn't Done, so that overdue work stands out.
62. As a user, I want a Deadline never to move a Task, so that a Task can sit on Tuesday with a Friday Deadline, or stay in a Category with a Deadline weeks away.

### Tags

63. As a user, I want a Task's Tags shown as small chips on the Task, so that I can see how it's tagged.
64. As a user, I want clicking a Tag to highlight every Task with that Tag across both rows and dim the rest, so that I can focus on one theme.
65. As a user, I want the active Tag shown in the top bar with an ✕ to clear it, so that I always know a filter is on and can turn it off.

### Moving Tasks

66. As a user, I want to drag a Task up or down within its column to set its order, so that the order is mine.
67. As a user, I want to drag a Task from a Category onto a Day column, so that I can Schedule it.
68. As a user, I want to drag a Task from a Day column onto a Category, so that I can unschedule it.
69. As a user, I want to drag Tasks between Day columns from Today onward, so that I can reschedule.
70. As a user, I want to drag Tasks between Categories, so that I can regroup them.
71. As a user, I want to drag Done Tasks too, landing at the bottom of the target column with the other Done Tasks, so that finished Tasks follow the same rules.
72. As a user, I want Past days to reject drops, so that I can't rewrite history.
73. As a user, I want to move Tasks with the keyboard as well, so that I can reorder without a mouse.

### Sync

74. As a user, I want my changes saved immediately with no save button, so that I never lose work.
75. As a user, I want changes made on one device or tab to show up on my other open devices or tabs within about a second, without reloading, so that every screen agrees.
76. As a user, I want my edits to appear instantly on the screen I'm using, even before the server confirms them, so that the app feels fast.
77. As a user, I want a clear message if a change fails to save, with the screen put back to what was really saved, so that I'm never misled about my data.

## Implementation Decisions

- **Stack** (ADR-0001): a React + TypeScript single-page app built with Vite and hosted on Vercel. Supabase provides the database, Google OAuth and Realtime. There's no custom server.
- **Online only.** No offline queue or local-first sync. Edits are applied optimistically and rolled back with a message if the Backend rejects them.
- **No phone layout** in v1. The target is desktop and laptop browsers.

### Modules

- **Backend (port)**: the only module that touches Supabase, and the single test seam. Its interface covers:
  - session: current user, sign in with Google, sign out
  - loading everything for the user: Categories, Tasks, Settings
  - commands: create, update, move, mark Done and delete a Task; create, rename, reorder and delete a Category (deleting also removes its Tasks); clear the Done Tasks in a Category; update Settings
  - Rollover up to a given Today
  - seeding the starter data
  - subscribing to remote changes

  It has two implementations: the **Supabase backend** and the **in-memory backend**. Both must behave the same at the interface. The in-memory backend lets a test simulate a change from "another device".
- **Board model**: deep, pure logic over the loaded data. It works out the ordered contents of each column (unfinished Tasks by position, then Done Tasks), which dates the Day row shows from a start date and day count, whether a date is Past, where a dropped Task goes (including the "Done Tasks land at the bottom" and "Past days reject drops" rules), the Rollover plan for a given Today, and which Tasks match a Tag filter. The UI asks it questions and never re-derives these rules itself.
- **Today clock**: gives the current local date and notices when it changes, by checking regularly and when the window regains focus. A change of Today triggers Rollover and re-renders. Tests drive it by faking the system clock.
- **UI**: top bar (« ◀ Today ▶ » · 5 6 7 · theme toggle · active Tag with ✕ · avatar/Sign out), Day row, Category row, column with Lines, Task line (checkbox on hover, Deadline badge, Tag chips), Task editor, Category header (rename in place, ⋯ menu, drag handle), "+ Add category" column, delete confirmation. Drag-and-drop uses a library with keyboard support (e.g. dnd-kit), so moves are accessible and testable.

### Data model (Supabase Postgres, every row owned by the user, row-level security limiting access to the owner)

- **categories**: id, user, name, position (ordering key).
- **tasks**: id, user, title, notes (nullable), deadline (date, nullable), tags (text array), done (bool), done_at (timestamp, nullable), day (date, nullable), category (foreign key with cascade delete, nullable), position (ordering key). A constraint ensures **exactly one** of day and category is set.
- **settings**: one row per user: day_count (5–7, default 7), theme (light / dark / null; null means follow the system).
- **Ordering keys** use fractional indexing, so moving or inserting a Task or Category only rewrites the row being moved.
- **Order of Done Tasks** within a column is by done_at (oldest first) and can't be rearranged by dragging. Unfinished Tasks follow position.
- **Rollover** is one Backend command, "roll over to date D". It moves every unfinished Task with day < D to day = D, appended after D's existing unfinished Tasks and keeping their relative order. It is idempotent, so devices running it at the same moment do no harm. It runs after load and whenever Today changes.
- **Seeding** happens when a signed-in user has no settings row. It creates the settings and the Groceries and School Categories with their starter Tasks (the problem-set Deadline is Today + 3), all at once.
- **Realtime**: the client subscribes to changes on the user's three tables and merges them into local state. When the same Task is edited on two devices at once, the last write wins, which is acceptable for a single user.

### Interaction details

- The number of Lines in a column is the larger of (column height ÷ Line height) and (Task count + 1). Line height is the same across the app.
- Clicking any empty Line opens an input on the first empty Line. Enter saves and opens the next empty Line; Escape, or leaving the input empty, cancels.
- The Day row's start date is not saved: every page load starts at Today. ◀/▶ move it ±1 day, «/» ±7, and Today resets it.
- Overdue Deadline badges use a red distinct from the #FD8A8A accent, so warnings don't look like highlights.
- The theme setting is null until the toggle is first pressed; after that the stored value wins over the system setting.

## Testing Decisions

- **One seam**: the Backend port. Tests render the **whole app** against the in-memory backend and drive it like a user, finding elements by role, label and text, and clicking, typing and using drag keyboard moves (pick up, arrows, drop). They assert only on what's on screen and on what the Backend ends up holding, never on component internals, store shape or hooks.
- **Today** is controlled by faking the system clock (the test runner's fake timers). Rollover, Past days and overdue Deadlines are tested by moving the clock past midnight, including skipping several days.
- **Live sync** is tested by changing the in-memory backend as if from another device and checking the screen updates without reloading.
- **Failed saves** are tested by making the in-memory backend reject a command and checking the screen reverts with a message.
- **Tools**: Vitest with Testing Library in a simulated browser (jsdom). There's no prior art: this is the project's first code, and these tests set the pattern.
- **What gets tested**: the user stories above, at the app level. In particular: Rollover (single and missed days, ordering, Done Tasks staying put), Past days being read-only and rejecting drops, Lines and the snap-to-next placement, ordering of Done Tasks and unticking, Day row navigation (±1, ±7, Today, 5/6/7 hiding without losing data), Category create/rename/reorder/delete with confirmation and Clear done, the editor (title, Deadline, Notes, Tags, Delete), Tag filtering, seeding on first sign-in, and saving settings.
- **Not tested automatically**: the Supabase backend itself (row-level security, Realtime wiring, OAuth). It's checked by hand against a dev Supabase project. Layout percentages, colours and the theme's visual look are checked by eye.

## Out of Scope

- Phone and tablet layouts, and installing to the home screen.
- Offline use.
- Sharing, collaboration, or multiple users seeing the same board.
- Sign-in other than Google.
- Recurring Tasks, reminders and notifications.
- Times of day, priorities, sub-tasks, attachments.
- Search, and a screen for managing Tags.
- Editing Past days, or reordering Done Tasks by hand.
- A resizable split between the two rows.
- Data export or import.

## Further Notes

- The vocabulary follows `GLOSSARY.md`: Day row, Day column, Today, Past day, Category row, Category, Line, Task, Done, Schedule, Deadline, Tag, Notes, Rollover. Use these terms in code, UI copy and tickets, and avoid the synonyms the glossary lists.
- This spec covers the whole of v1 from an empty repo, including project setup (Vite, Vitest, Supabase project and schema, Vercel deploy). `/to-tickets` should break it into thin vertical slices: for example, start with signing in plus one hard-coded column, then add Lines and adding Tasks, before building out the rest.
