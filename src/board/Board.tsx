import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BoardDragAndDrop } from "./BoardDragAndDrop";
import { BottomBar } from "./BottomBar";
import { dayRowDates, isPast, isReadOnly, LINE_HEIGHT, type Place } from "./boardModel";
import { CategoryRow } from "./CategoryRow";
import { addDays, type CalendarDate } from "./dates";
import { DayRow } from "./DayRow";
import { SearchBox } from "./SearchBox";
import { TaskEditor } from "./TaskEditor";
import type { TaskLineActions } from "./TaskLines";
import { useEffectiveTheme } from "./theme";
import { useCategories } from "./useCategories";
import { useSaveFailures } from "./useSaveFailures";
import { useSettings } from "./useSettings";
import { useTasks } from "./useTasks";
import { useToday } from "./useToday";

/** The signed-in page: the Day row (60%), the Category row (40%) and the bottom bar. */
export function Board() {
  const { failures, showingMessage, dismissMessage } = useSaveFailures();
  const { settings, updateSettings } = useSettings(failures);
  const todayDate = useToday();
  const [dayRowStart, setDayRowStart] = useState<CalendarDate>(todayDate);
  // A Day row that starts at Today moves on with it when the date changes.
  const previousToday = useRef(todayDate);
  useEffect(() => {
    const previous = previousToday.current;
    previousToday.current = todayDate;
    setDayRowStart((start) => (start === previous ? todayDate : start));
  }, [todayDate]);
  const theme = useEffectiveTheme(settings?.theme ?? null);
  const { tasks, createTask, setDone, updateTask, deleteTask, moveTask, clearDone, forgetCategoryTasks } = useTasks(
    failures,
    todayDate,
  );
  const categoryActions = useCategories(failures);
  const { categories } = categoryActions;
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // Typed into the search box; ticket 13 makes it filter the page.
  const [searchQuery, setSearchQuery] = useState("");
  const editingTask = tasks?.find((task) => task.id === editingTaskId) ?? null;

  const taskActions: TaskLineActions = {
    today: todayDate,
    activeTag,
    onSetDone: setDone,
    onEdit: setEditingTaskId,
    onPickTag: setActiveTag,
  };

  // Every column showing that takes drops, in reading order: where keyboard dragging walks.
  const places: Place[] = [
    ...(settings
      ? dayRowDates(dayRowStart, settings.dayCount)
          .filter((day) => !isPast(day, todayDate))
          .map((day) => ({ day }))
      : []),
    ...(categories ?? []).map((category) => ({ categoryId: category.id })),
  ];

  return (
    <div
      className="board"
      style={{ "--line-height": `${LINE_HEIGHT}px`, "--day-count": settings?.dayCount ?? 7 } as CSSProperties}
    >
      <BoardDragAndDrop
        tasks={tasks ?? []}
        categories={categories ?? []}
        places={places}
        onMoveTask={moveTask}
        onMoveCategory={categoryActions.moveCategory}
      >
        <section className="day-row" aria-label="Day row">
          {settings && tasks && (
            <DayRow
              start={dayRowStart}
              count={settings.dayCount}
              today={todayDate}
              tasks={tasks}
              onAddTask={(day, title) => createTask({ day }, title)}
              taskActions={taskActions}
            />
          )}
        </section>
        <section className="category-row" aria-label="Category row">
          {tasks && categories && (
            <CategoryRow
              categories={categories}
              onCreateCategory={categoryActions.createCategory}
              onRenameCategory={categoryActions.renameCategory}
              onDeleteCategory={categoryActions.deleteCategory}
              tasks={tasks}
              onAddTask={(categoryId, title) => createTask({ categoryId }, title)}
              taskActions={taskActions}
              onClearDone={clearDone}
              onCategoryDeleted={forgetCategoryTasks}
            />
          )}
        </section>
      </BoardDragAndDrop>
      <BottomBar
        navigation={
          settings && {
            start: dayRowStart,
            moveDays: (days) => setDayRowStart((start) => addDays(start, days)),
            goToToday: () => setDayRowStart(todayDate),
            dayCount: settings.dayCount,
            setDayCount: (dayCount) => updateSettings({ dayCount }),
            theme,
            toggleTheme: () => updateSettings({ theme: theme === "dark" ? "light" : "dark" }),
          }
        }
        activeTag={activeTag}
        onClearTag={() => setActiveTag(null)}
      />
      <SearchBox query={searchQuery} onQueryChange={setSearchQuery} />
      {editingTask && (
        <TaskEditor
          key={editingTask.id}
          task={editingTask}
          readOnly={isReadOnly(editingTask, todayDate)}
          onChange={(changes) => updateTask(editingTask.id, changes)}
          onDelete={() => {
            setEditingTaskId(null);
            deleteTask(editingTask.id);
          }}
          onClose={() => setEditingTaskId(null)}
        />
      )}
      {showingMessage && (
        <div className="save-failed" role="alert">
          Couldn't save your change, so it's been undone.
          <button type="button" className="button button--quiet button--icon" aria-label="Dismiss" onClick={dismissMessage}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
