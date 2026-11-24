# Munus Vitae

A minimal personal to-do app, synced across devices. One page split into a Day row (what to do on which day) and a Category row (everything else, grouped by user-defined categories).

## Language

### Places a Task can be

**Day row**:
The top half of the page: a window of 5 to 7 consecutive Day columns (the user picks how many). It starts at today and can be scrolled through other dates.
_Avoid_: Week, calendar, timeline

**Today**:
The current calendar date according to the clock of the device in use.

**Day column**:
One column in the Day row, standing for a single calendar date.
_Avoid_: Day slot, date bucket

**Category row**:
The bottom half of the page, holding one Category column per Category in the selected Area.
_Avoid_: Backlog, lists

**Area**:
A user-defined, named group of Categories (e.g. "Personal", "Work"), shown as a tab between the Day row and the Category row. Only the selected Area's Categories are shown. Every Category belongs to exactly one Area.
_Avoid_: Board (the whole page), space, workspace, category group

**Category**:
A user-defined, named grouping of Tasks that aren't scheduled on a day (e.g. "Errands", "Reading"). Shown as a column in the Category row.
_Avoid_: List, project, tag, bucket

**Line**:
One ruled slot in a column, like a line on notebook paper. Every column is divided into Lines. Tasks fill them from the top with no gaps, and clicking any empty Line adds a Task.
_Avoid_: Row, slot

### Tasks

**Task**:
A single to-do item. It is always in exactly one place: either one Day column or one Category.
_Avoid_: Item, todo, card

**Done**:
The state of a Task that has been ticked off. A Done Task stays visible, crossed out, below the unfinished Tasks in its column.
_Avoid_: Completed, finished, checked

**Schedule**:
To move a Task into a Day column, for example by dragging it from a Category.
_Avoid_: Assign, plan

**Deadline**:
An optional date by which a Task must be Done. It is shown as a badge on the Task and never changes where the Task lives.
_Avoid_: Due date (ambiguous with the Day column a Task sits in)

**Tag**:
A free-form label on a Task, used to filter Tasks across both rows. A Task can have several Tags. Unlike a Category, a Tag is not a place.
_Avoid_: Label, category

**Notes**:
Optional free text attached to a Task.
_Avoid_: Description, details

**Rollover**:
What happens when Today changes: unfinished Tasks from every earlier Day column move into Today. Done Tasks stay on the day they were in.
_Avoid_: Carry-over, overdue

**Past day**:
A Day column before Today. It is read-only and holds only the Tasks that were Done on it, as a history.
_Avoid_: Archive, log
