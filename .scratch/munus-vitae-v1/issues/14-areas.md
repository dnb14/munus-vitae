# 14: Areas

**What to build:** Categories are grouped into **Areas** (e.g. "Personal", "School", "Work"). The strip between the Day row and the Category row shows the Areas as tabs, and only the selected Area's Categories show in the Category row.

- **Tabs:**
  - Clicking a tab selects that Area. The selected Area is saved in settings, so it survives a reload and is the same on every device.
  - "+" at the end of the tabs adds an Area, named in place the way a new Category is.
  - Double-clicking a tab renames it, and the selected tab's ⋯ menu has Rename and Delete.
  - Tabs can be dragged to reorder them, by pointer and by keyboard, using fractional ordering like Categories.
- **Deleting an Area:**
  - An Area with Categories asks first: "Delete Personal and its 3 categories (12 tasks)?" Confirming deletes the Area, its Categories and their Tasks.
  - An empty Area is deleted without asking.
  - The last remaining Area can't be deleted, and its Delete item is disabled.
- **Moving a Category:** a Category's ⋯ menu gets "Move to ▸", listing the other Areas. The Category goes to the end of the target Area. There's no dragging a Category onto a tab.
- **Dragging Tasks:** a Task can be dragged only into the Categories on screen. To move it to another Area, switch tabs first.
- **Existing data:** the migration creates an Area "Personal" for every user with Categories and moves all their Categories into it.
- **New users:** seeding creates "Personal" holding Groceries and School.
- **Search dots:** once ticket 13 is done, tabs holding matches out of view show a dot.
- **Live sync:** Area changes sync live, like Categories.

**Blocked by:** 13: Writing Tags inline, the Deadline clock and Search.

**Status:** ready-for-agent

- [ ] A new `areas` table (owner, name, position) with row-level security limited to the owner, and GRANTs to `authenticated`
- [ ] `categories.area_id` is added, along with `settings.selected_area_id`
- [ ] The migration moves existing Categories into a "Personal" Area per user
- [ ] The Backend interface lists, creates, renames, reorders and deletes Areas and moves a Category to another Area, in both backends, with live sync
- [ ] The tab strip shows the Areas in order. Selecting one shows only its Categories, and the selection survives a reload.
- [ ] "+" adds an Area, and double-click or ⋯ → Rename renames one
- [ ] Tabs reorder by drag and by keyboard
- [ ] Deleting an Area with Categories asks with the counts and deletes everything. An empty Area is deleted without asking, and the last Area can't be deleted.
- [ ] Category ⋯ → Move to ▸ moves it to the end of the chosen Area
- [ ] First sign-in seeds "Personal" with Groceries and School
- [ ] App-level tests cover each of the above against the in-memory backend
- [ ] GLOSSARY.md has the Area entry. The migration is run by hand in the Supabase SQL editor.
