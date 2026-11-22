# 07: Task editor, Deadlines and Tags

**What to build:** Clicking a Task's text opens a small editor where I can change the title, set or clear a **Deadline**, write **Notes**, add or remove **Tags** by typing (no screen for managing tags), and Delete the Task. A Task with a Deadline shows a small date badge, which turns red (a red distinct from the #FD8A8A accent) once the Deadline has passed and the Task isn't Done. A Deadline never moves a Task. Tags show as small chips on the Task. Clicking a Tag chip filters the page: matching Tasks in both rows stay highlighted and the rest are dimmed. The active Tag appears in the top bar with an ✕ to clear it.

**Blocked by:** 05: Lines and adding Tasks.

**Status:** ready-for-agent

- [ ] The Backend interface can update a Task's title, deadline, notes and tags, and delete a Task, in both backends
- [ ] Clicking a Task's text opens the editor; the checkbox doesn't open it
- [ ] Title, Deadline, Notes and Tags save and survive a reload; an empty title is rejected
- [ ] Tags are added by typing and removed individually; duplicates on the same Task are ignored
- [ ] Delete removes the Task
- [ ] The Deadline badge shows the date; it turns red when the date is before Today and the Task isn't Done
- [ ] Setting a Deadline doesn't change the Task's day or Category
- [ ] Clicking a Tag chip dims every Task without that Tag in both rows; the top bar shows the Tag with ✕; ✕ clears the filter
- [ ] The Board model answers "does this Task match the active Tag filter"
- [ ] App-level tests (with a faked clock) cover editing each field, Delete, the badge turning red after the Deadline passes, and applying and clearing a Tag filter
