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

/** The place a Task is in. */
export function placeOf(task: Task): Place {
  return task.day !== null ? { day: task.day } : { categoryId: task.categoryId! };
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

/**
 * When a Task ticked now counts as Done: now, or just after the latest Done
 * Task in its place if that is later (same millisecond, or a clock behind),
 * so a newly ticked Task always lands at the bottom of its column.
 */
export function doneAtFor(tasks: Task[], place: Place, now: Date): string {
  const { done } = columnContents(tasks, place);
  const latest = done[done.length - 1]?.doneAt;
  if (latest && Date.parse(latest) >= now.getTime()) return new Date(Date.parse(latest) + 1).toISOString();
  return now.toISOString();
}

/**
 * The ordering key for a new or unticked Task: right after the last
 * unfinished Task in its place.
 */
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

/** Whether a Task's Deadline has passed (it is before Today) while the Task isn't Done. */
export function isOverdue(task: Task, today: CalendarDate): boolean {
  return task.deadline !== null && !task.done && task.deadline < today;
}

/** Whether a Task matches the active Tag filter. With no filter, every Task matches. */
export function matchesTagFilter(task: Task, activeTag: string | null): boolean {
  return activeTag === null || task.tags.includes(activeTag);
}

/** The Tags with one more added at the end. Blank Tags and ones the Task already has are ignored. */
export function withTag(tags: string[], tag: string): string[] {
  const trimmed = tag.trim();
  if (!trimmed || tags.includes(trimmed)) return tags;
  return [...tags, trimmed];
}

/** Oldest first, comparing moments rather than text, since timestamps arrive in more than one format. */
function byDoneAt(a: Task, b: Task): number {
  return Date.parse(a.doneAt ?? "") - Date.parse(b.doneAt ?? "") || 0;
}
