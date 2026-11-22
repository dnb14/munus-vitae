# 08: Moving Tasks

**What to build:** I can drag a Task up or down within its column to reorder it, and drag it into any other column: Category → Day column (**Schedule**), Day column → Category (unschedule), between Day columns, and between Categories. Unfinished Tasks land where I drop them among the unfinished Tasks. Done Tasks land at the bottom with the other Done Tasks, ordered by when they were ticked. Everything works with the keyboard as well as the mouse, using the drag library added in 04.

**Blocked by:** 06: Done.

**Status:** ready-for-agent

- [ ] The Backend interface can move a Task to a target day or Category at a given position, in both backends; only the moved Task's row changes (fractional indexing), and exactly one of day/category stays set
- [ ] The Board model decides where a dropped Task lands, including Done Tasks always landing among the Done Tasks
- [ ] Reordering within a column works and survives a reload
- [ ] Moving between Day columns, Category → day, day → Category, and between Categories all work
- [ ] Keyboard dragging (pick up, arrows, drop) performs all of the above
- [ ] App-level tests use keyboard dragging to cover reordering, Scheduling, unscheduling, moving between Categories, and dropping a Done Task
