# 06: Done

**What to build:** Hovering over a Task shows its checkbox. Ticking it marks the Task Done: crossed out and greyed (visible without hovering), and moved below the unfinished Tasks in its column. Done Tasks are ordered by when they were ticked. Hovering over a Done Task shows its ticked checkbox; unticking puts the Task back at the end of the unfinished Tasks. Each Category's ⋯ menu gains "Clear done", which removes its Done Tasks.

**Blocked by:** 05: Lines and adding Tasks.

**Status:** done

- [x] The Backend interface can mark a Task Done or not Done (setting/clearing done_at) and clear a Category's Done Tasks, in both backends
- [x] The Board model orders each column as unfinished Tasks (by position) then Done Tasks (by done_at)
- [x] The checkbox shows only on hover (and keyboard focus) for unfinished Tasks
- [x] Done Tasks look crossed out and greyed without hovering
- [x] Unticking moves the Task to the end of the unfinished Tasks
- [x] "Clear done" removes only that Category's Done Tasks
- [x] App-level tests cover ticking, the order of several Done Tasks, unticking, and Clear done
