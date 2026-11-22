# 11: Starter data for new accounts

**What to build:** The first time I sign in, my account is set up with default settings and two starter Categories: **Groceries** (Milk, Eggs, Bread) and **School** ("Read chapter 3", and "Finish problem set" with a Deadline 3 days after Today and the Tag `homework`). The Day row starts empty. These are ordinary Categories and Tasks I can change or delete. Signing in again never re-creates them.

**Blocked by:** 07: Task editor, Deadlines and Tags.

**Status:** ready-for-agent

- [ ] The Backend sets up the starter data all at once when a signed-in user has no settings row, in both backends
- [ ] The first sign-in shows Groceries and School with the listed Tasks in order; "Finish problem set" shows a Deadline badge 3 days after Today and a `homework` chip
- [ ] The Day row is empty
- [ ] Signing in again, or deleting the starter Categories and reloading, doesn't bring them back
- [ ] App-level tests cover the first sign-in creating the starter data and a later sign-in leaving it alone
