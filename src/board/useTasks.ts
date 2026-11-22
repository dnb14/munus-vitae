import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";
import { doneAtFor, newTaskPosition, placeFields, placeOf, type Place } from "./boardModel";

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

  return { tasks, createTask, setDone, clearDone, forgetCategoryTasks };
}
