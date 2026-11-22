# 05: Lines and adding Tasks

**What to build:** Every Day column and Category column is ruled into Lines that fill its height, like notebook paper. I click any empty Line, type, and press Enter to add a Task. It snaps to the Line right after the last Task, so there are never gaps, and the next empty Line opens straight away so I can keep typing. Escape, or leaving the input empty, cancels. A full column scrolls and always keeps one empty Line at the bottom. Each Task lives in exactly one place, a day or a Category. Tasks on days hidden by a smaller 5/6/7 choice are kept and reappear. Deleting a Category that has Tasks now asks "Delete <name> and its N tasks?" first.

**Blocked by:** 03: Day row, navigation and theme toggle; 04: Categories.

**Status:** done

- [x] A tasks table matching the spec's data model (title, notes, deadline, tags, done, done_at, day, category with cascade delete, ordering key) with a constraint that exactly one of day/category is set, and owner-only row-level security
- [x] The Backend interface can load Tasks and create a Task in a day or Category, in both backends
- [x] A **Board model** module answers "what's in this column, in order" and "which dates does the Day row show"; the UI uses it rather than working these out itself
- [x] Lines fill each column; Line count = max(fits in height, Task count + 1); Line height is the same across the app
- [x] Clicking any empty Line opens an input on the first empty Line; Enter saves and opens the next; Escape or an empty input cancels
- [x] Tasks appear in the order added and survive a reload
- [x] Switching from 7 to 5 days and back shows the Tasks on days 6–7 again
- [x] Deleting a Category with Tasks asks for confirmation naming the Task count; confirming removes the Category and its Tasks, cancelling keeps both
- [x] App-level tests cover adding to a Day column and to a Category, snapping when clicking a lower Line, typing several Tasks in a row, cancel, hidden days keeping their Tasks, and deleting a Category with Tasks
