# 13: Writing Tags inline, the Deadline clock and Search

**What to build:** Tags and Deadlines leave the Lines, and **Search** replaces Tag filtering.

- **Writing `#tags`:** typing "Buy milk #groceries #weekly" on a Line and pressing Enter creates a Task with the title "Buy milk" and the Tags `groceries` and `weekly`.
  - The same happens when the title is edited in the Task editor. New Tags are added to the existing ones.
  - The `#words` are removed from the title, and duplicate Tags are ignored.
  - A title made only of `#words` is rejected, the same way an empty title is.
- **Lines show only the title and checkbox.** Tag chips and the Deadline badge come off the Line. Tags and Deadline are still shown and edited in the Task editor.
- **Deadline clock:** a Task with a Deadline shows a small clock icon at the right of its Line.
  - It's muted grey, and red once the Deadline is before Today and the Task isn't Done.
  - Hovering or focusing it shows "Due Fri 27 Nov", and that text is also its accessible name.
- **Search:** the search box (built in ticket 12: hidden until `/` with nothing focused or Ctrl/⌘+K opens it in the middle of the screen; Esc clears and closes it) filters as you type. Its text is already held in `Board` as `searchQuery`. Matching Tasks in both rows stay at full strength and the rest dim, the way the Tag filter worked.
  - Plain text matches a Task's title or any of its Tags, ignoring case.
  - Text starting with `#` matches Tags only.
  - Notes are never searched.
  - Once ticket 14 is done, Area tabs that hold matching Tasks out of view show a small dot.
- **Tag filtering is removed:** no clickable Tag chips, and no active Tag in a bar. Tags in the editor are not clickable filters.

**Blocked by:** 12: Visual redesign.

**Status:** ready-for-agent

- [ ] Creating a Task with `#words` saves the cleaned title and the Tags. The Backend holds both.
- [ ] Editing the title in the editor with `#words` adds those Tags and cleans the title
- [ ] A title made only of `#words` is rejected
- [ ] Lines show no Tag chips or Deadline badges
- [ ] A Task with a Deadline shows the clock with "Due <weekday> <day> <month>". It's red only when overdue and not Done.
- [ ] Typing in Search dims non-matching Tasks in both rows. Matching covers the title or Tags, ignores case, and never looks at Notes.
- [ ] `#text` in Search matches Tags only
- [ ] Closing Search with Esc brings every Task back to full strength
- [ ] The Board model answers "does this Task match this search", replacing the Tag-filter question
- [ ] App-level tests cover inline Tags (creating and editing), the clock and its overdue state, and Search by title, Tag and `#`, with clearing and shortcuts
- [ ] The glossary's Tag and Deadline entries match the new behaviour
