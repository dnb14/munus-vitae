import { generateKeyBetween } from "fractional-indexing";
import { byPosition, type Task } from "../backend/backend";
import { addDays, type CalendarDate } from "./dates";

/**
 * The Board model: pure rules over the loaded data. The UI asks these
 * questions and never works the answers out itself.
 */

/** Where a Task can live: one Day column or one Category. */
export type Place = { day: CalendarDate } | { categoryId: string };

/** The height of one Line, in pixels. The same everywhere in the app. */
export const LINE_HEIGHT = 28;

/** The dates the Day row shows: `count` consecutive days from `start`. */
export function dayRowDates(start: CalendarDate, count: number): CalendarDate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function isInPlace(task: Task, place: Place): boolean {
  return "day" in place ? task.day === place.day : task.categoryId === place.categoryId;
}

/** The day and categoryId fields of a Task in this place. */
export function placeFields(place: Place): Pick<Task, "day" | "categoryId"> {
  return "day" in place ? { day: place.day, categoryId: null } : { day: null, categoryId: place.categoryId };
}

/** Whether a date is a Past day: before Today. */
export function isPast(date: CalendarDate, today: CalendarDate): boolean {
  return date < today;
}

/**
 * What's in a column, in order: unfinished Tasks by position, then Done Tasks
 * by when they were Done. A new Task snaps in between, after the last unfinished one.
 */
export function columnContents(tasks: Task[], place: Place): { unfinished: Task[]; done: Task[] } {
  const here = tasks.filter((task) => isInPlace(task, place));
  return {
    unfinished: here.filter((task) => !task.done).sort(byPosition),
    done: here.filter((task) => task.done).sort(byDoneAt),
  };
}

/** The ordering key for a new Task: right after the last unfinished Task in its place. */
export function newTaskPosition(tasks: Task[], place: Place): string {
  const { unfinished } = columnContents(tasks, place);
  return generateKeyBetween(unfinished[unfinished.length - 1]?.position ?? null, null);
}

/**
 * How many empty Lines a column shows below its Tasks (and the new-Task input,
 * if open). The column has max(Lines that fit its height, Tasks + 1) Lines,
 * so there is always one to add to; the open input takes up that one.
 */
export function emptyLineCount(columnHeight: number, taskCount: number, adding: boolean): number {
  const lines = Math.max(Math.floor(columnHeight / LINE_HEIGHT), taskCount + 1);
  return lines - taskCount - (adding ? 1 : 0);
}

/** How many Tasks are in a Category, Done or not. */
export function categoryTaskCount(tasks: Task[], categoryId: string): number {
  return tasks.filter((task) => task.categoryId === categoryId).length;
}

function byDoneAt(a: Task, b: Task): number {
  const x = a.doneAt ?? "";
  const y = b.doneAt ?? "";
  return x < y ? -1 : x > y ? 1 : 0;
}
