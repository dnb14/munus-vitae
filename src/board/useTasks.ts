import { useCallback, useEffect, useRef, useState } from "react";
import type { Task, TaskDetails } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";
import { doneAtFor, whereDropLands, newTaskPosition, placeFields, placeOf, type DropTarget, type Place } from "./boardModel";

/**
 * Loads the user's Tasks and saves changes. Changes show immediately;
 * handling a failed save comes with ticket 09.
 */
export function useTasks() {
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
  }, [backend, replaceTasks]);

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
      void backend.createTask(task);
    },
    [backend, replaceTasks],
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
        void backend.markTaskDone(taskId, doneAt);
      } else {
        const position = newTaskPosition(current, place);
        replaceTasks(current.map((t) => (t.id === taskId ? { ...t, done: false, doneAt: null, position } : t)));
        void backend.markTaskNotDone(taskId, position);
      }
    },
    [backend, replaceTasks],
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
      void backend.updateTask(taskId, changed);
    },
    [backend, replaceTasks],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const current = latest.current;
      if (!current) return;
      replaceTasks(current.filter((t) => t.id !== taskId));
      void backend.deleteTask(taskId);
    },
    [backend, replaceTasks],
  );

  /** Moves a dropped Task to where the Board model says it lands. Only that Task changes. */
  const moveTask = useCallback(
    (taskId: string, target: DropTarget) => {
      const current = latest.current;
      if (!current) return;
      const landed = whereDropLands(current, taskId, target);
      if (!landed) return;
      const fields = placeFields(landed.place);
      replaceTasks(current.map((t) => (t.id === taskId ? { ...t, ...fields, position: landed.position } : t)));
      void backend.moveTask(taskId, fields, landed.position);
    },
    [backend, replaceTasks],
  );

  /** Removes a Category's Done Tasks. */
  const clearDone = useCallback(
    (categoryId: string) => {
      const current = latest.current;
      if (!current) return;
      replaceTasks(current.filter((task) => !(task.categoryId === categoryId && task.done)));
      void backend.clearDoneTasks(categoryId);
    },
    [backend, replaceTasks],
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
