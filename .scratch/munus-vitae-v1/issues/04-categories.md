# 04: Categories

**What to build:** The Category row shows one column per Category, in my order, with a "+ Add category" column at the right end. I can create a Category, click its name to rename it in place, delete it from a ⋯ menu on its header, and drag headers to reorder. The row scrolls sideways when the Categories don't fit. This ticket adds the drag-and-drop library (with keyboard support) that ticket 08 reuses for Tasks.

**Blocked by:** 02: Supabase, Google sign-in and Vercel deploy.

**Status:** done

- [x] A categories table (id, user, name, ordering key) with owner-only row-level security; migration in the repo
- [x] The Backend interface can create, rename, reorder and delete Categories, in both backends; reordering only rewrites the moved Category's ordering key (fractional indexing)
- [x] "+ Add category" creates a Category whose name I type in place; empty names are rejected
- [x] Clicking a Category name edits it in place; Enter saves, Escape cancels
- [x] The ⋯ menu offers Delete; an empty Category is deleted straight away (the confirmation for Categories with Tasks comes in 05)
- [x] Dragging a header, by mouse or keyboard, reorders Categories, and the order survives a reload
- [x] The Category row scrolls sideways when the Categories don't fit
- [x] App-level tests cover create, rename, delete, and reorder (using keyboard drag)
