# 10: Rollover and read-only Past days

**What to build:** When Today changes, every unfinished Task on an earlier day moves into Today. This happens after midnight with the app open (no reload needed), and on load after days away, covering all missed days. Rolled-over Tasks go after Today's existing unfinished Tasks and keep their relative order. Done Tasks stay on their day as history. Past days are read-only: I can scroll back to see what I finished, but I can't add, tick, untick or drag Tasks in or out of them. Clicking a Task in a Past day opens the editor read-only.

**Blocked by:** 06: Done; 07: Task editor, Deadlines and Tags; 08: Moving Tasks.

**Status:** done

- [x] A **Today clock** gives the local date and notices when it changes, by checking regularly and when the window regains focus
- [x] The Board model produces the Rollover plan for a given Today; the Backend has one idempotent "roll over to date D" command, in both backends
- [x] Rollover runs after load and whenever Today changes
- [x] Rolled-over Tasks keep their relative order and go after Today's existing unfinished Tasks; Done Tasks don't move
- [x] Past days show no empty Lines to click, no checkboxes, and reject drops; their Tasks can't be dragged out
- [x] The editor opens read-only for Tasks in a Past day
- [x] App-level tests with a faked clock cover: crossing midnight with the app open, loading after 3 missed days, the ordering rule, Done Tasks staying put, and each read-only rule
