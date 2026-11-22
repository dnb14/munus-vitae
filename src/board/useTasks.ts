import { useCallback, useEffect, useRef, useState } from "react";
import type { Task, TaskDetails } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";
import type { SaveFailures } from "./useSaveFailures";
import {
  doneAtFor,
  newTaskPosition,
  placeFields,
  placeOf,
  rolloverPlan,
  whereDropLands,
  type DropTarget,
  type Place,
} from "./boardModel";
import type { CalendarDate } from "./dates";

/**
 * Loads the user's Tasks and saves changes. Changes show
 * immediately; when the Backend rejects one, `failures` counts it and this
 * reloads what is really saved. Once loaded, and whenever Today changes,
 * unfinished Tasks on Past days Roll over into Today.
 */
export function useTasks({ count: failureCount, watch }: SaveFailures, today: CalendarDate) {
  const backend = useBackend();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  // The latest Tasks, so several Tasks added before a re-render each get the next position.
  const latest = useRef<Task[] | null>(null);

  const replaceTasks = useCallback((next: Task[]) => {
    latest.current = next;
    setTasks(next);
  }, []);

  useEffect(() => {
    let active = true;
    backend.getTasks().then((loaded) => {
      if (active) replaceTasks(loaded);
    });
    return () => {
      active = false;
    };
  }, [backend, failureCount, replaceTasks]);

  // Merge saved changes from every device, this one included.
  useEffect(
    () =>
      backend.subscribeToChanges((change) => {
        const current = latest.current;
        if (!current) return;
        if (change.kind === "taskSaved") {
          const { task } = change;
          const exists = current.some((t) => t.id === task.id);
          replaceTasks(exists ? current.map((t) => (t.id === task.id ? task : t)) : [...current, task]);
        } else if (change.kind === "taskDeleted") {
          replaceTasks(current.filter((t) => t.id !== change.id));
        } else if (change.kind === "categoryDeleted") {
          replaceTasks(current.filter((t) => t.categoryId !== change.id));
        }
      }),
    [backend, replaceTasks],
  );

  const loaded = tasks !== null;
  useEffect(() => {
    const current = latest.current;
    if (!loaded || !current) return;
    const plan = rolloverPlan(current, today);
    if (plan.length === 0) return;
    const moved = new Map(plan.map(({ id, position }) => [id, position]));
    replaceTasks(current.map((t) => (moved.has(t.id) ? { ...t, day: today, position: moved.get(t.id)! } : t)));
    watch(backend.rollOverTo(today));
  }, [backend, watch, replaceTasks, loaded, today]);

  const createTask = useCallback(
    (place: Place, title: string) => {
      const current = latest.current;
      if (!current) return;
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        notes: null,
        deadline: null,
        tags: [],
        done: false,
        doneAt: null,
        ...placeFields(place),
        position: newTaskPosition(current, place),
      };
      replaceTasks([...current, task]);
      watch(backend.createTask(task));
    },
    [backend, watch, replaceTasks],
  );

  /** Ticks a Task (Done, at the bottom of its column) or unticks it (back at the end of the unfinished Tasks). */
  const setDone = useCallback(
    (taskId: string, done: boolean) => {
      const current = latest.current;
      const task = current?.find((t) => t.id === taskId);
      if (!current || !task || task.done === done) return;
      const place = placeOf(task);
      if (done) {
        const doneAt = doneAtFor(current, place, new Date());
        replaceTasks(current.map((t) => (t.id === taskId ? { ...t, done: true, doneAt } : t)));
        watch(backend.markTaskDone(taskId, doneAt));
      } else {
        const position = newTaskPosition(current, place);
        replaceTasks(current.map((t) => (t.id === taskId ? { ...t, done: false, doneAt: null, position } : t)));
        watch(backend.markTaskNotDone(taskId, position));
      }
    },
    [backend, watch, replaceTasks],
  );

  /** Saves changed details of a Task. Unchanged details, and an empty title, are ignored. */
  const updateTask = useCallback(
    (taskId: string, changes: Partial<TaskDetails>) => {
      const current = latest.current;
      const task = current?.find((t) => t.id === taskId);
      if (!current || !task) return;
      const changed = changedDetails(task, changes);
      if (Object.keys(changed).length === 0) return;
      replaceTasks(current.map((t) => (t.id === taskId ? { ...t, ...changed } : t)));
      watch(backend.updateTask(taskId, changed));
    },
    [backend, watch, replaceTasks],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const current = latest.current;
      if (!current) return;
      replaceTasks(current.filter((t) => t.id !== taskId));
      watch(backend.deleteTask(taskId));
    },
    [backend, watch, replaceTasks],
  );

  /** Moves a dropped Task to where the Board model says it lands. Only that Task changes. */
  const moveTask = useCallback(
    (taskId: string, target: DropTarget) => {
      const current = latest.current;
      if (!current) return;
      const landed = whereDropLands(current, taskId, target, today);
      if (!landed) return;
      const fields = placeFields(landed.place);
      replaceTasks(current.map((t) => (t.id === taskId ? { ...t, ...fields, position: landed.position } : t)));
      watch(backend.moveTask(taskId, fields, landed.position));
    },
    [backend, watch, replaceTasks, today],
  );

  /** Removes a Category's Done Tasks. */
  const clearDone = useCallback(
    (categoryId: string) => {
      const current = latest.current;
      if (!current) return;
      replaceTasks(current.filter((task) => !(task.categoryId === categoryId && task.done)));
      watch(backend.clearDoneTasks(categoryId));
    },
    [backend, watch, replaceTasks],
  );

  /** Drops a deleted Category's Tasks from the screen. The Backend deletes them with the Category. */
  const forgetCategoryTasks = useCallback(
    (categoryId: string) => {
      const current = latest.current;
      if (current) replaceTasks(current.filter((task) => task.categoryId !== categoryId));
    },
    [replaceTasks],
  );

  return { tasks, createTask, setDone, updateTask, deleteTask, moveTask, clearDone, forgetCategoryTasks };
}

/** The details in `changes` that differ from the Task's, leaving out an empty title. */
function changedDetails(task: Task, changes: Partial<TaskDetails>): Partial<TaskDetails> {
  const changed: Partial<TaskDetails> = {};
  if (changes.title !== undefined && changes.title.trim() && changes.title !== task.title) changed.title = changes.title;
  if (changes.notes !== undefined && changes.notes !== task.notes) changed.notes = changes.notes;
  if (changes.deadline !== undefined && changes.deadline !== task.deadline) changed.deadline = changes.deadline;
  if (changes.tags !== undefined && !sameTags(changes.tags, task.tags)) changed.tags = changes.tags;
  return changed;
}

function sameTags(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((tag, i) => tag === b[i]);
}
