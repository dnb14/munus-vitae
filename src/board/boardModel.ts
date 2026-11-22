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

/** What a dragged Task is dropped on: another Task, or a column (its empty space). */
export type DropTarget = { taskId: string } | { place: Place };

/**
 * Where a dropped Task lands: its new place and ordering key, or null when the
 * drop changes nothing. An unfinished Task dropped on an unfinished Task in its
 * own column takes that Task's place in the order; dropped on one in another column it goes
 * just before it; dropped on a column, or on a Done Task, it goes after the
 * column's unfinished Tasks. A Done Task always lands among the Done Tasks,
 * ordered by when it was ticked, so only its place can change.
 */
export function whereDropLands(
  tasks: Task[],
  taskId: string,
  target: DropTarget,
): { place: Place; position: string } | null {
  const task = tasks.find((t) => t.id === taskId);
  const targetTask = "taskId" in target ? tasks.find((t) => t.id === target.taskId) : undefined;
  if (!task || ("taskId" in target && !targetTask)) return null;
  const place = targetTask ? placeOf(targetTask) : (target as { place: Place }).place;
  const samePlace = isInPlace(task, place);
  const { unfinished } = columnContents(tasks, place);
  const others = unfinished.filter((t) => t.id !== taskId);

  let index = others.length;
  if (task.done) {
    if (samePlace) return null;
  } else if (targetTask && !targetTask.done) {
    index = samePlace ? unfinished.indexOf(targetTask) : others.indexOf(targetTask);
  }
  if (samePlace && !task.done && unfinished.indexOf(task) === index) return null;

  const position = generateKeyBetween(others[index - 1]?.position ?? null, others[index]?.position ?? null);
  return { place, position };
}

/**
 * Where a Task picked up by keyboard would be dropped: the column (an index
 * into the board's places, in reading order: the Day columns, then the
 * Categories) and the index among that column's unfinished Tasks.
 */
export type KeyboardDrop = { placeIndex: number; index: number };

/** Where a Task picked up by keyboard starts: where it is. Null if its column isn't showing. */
export function keyboardStart(tasks: Task[], taskId: string, places: Place[]): KeyboardDrop | null {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const placeIndex = places.findIndex((place) => isInPlace(task, place));
  if (placeIndex < 0) return null;
  const index = task.done ? 0 : columnContents(tasks, places[placeIndex]).unfinished.indexOf(task);
  return { placeIndex, index };
}

/**
 * Where an arrow key moves a keyboard drop: Up and Down move one Task within
 * the column, Left and Right move to the previous or next column, keeping as
 * close to the same index as that column allows. A Done Task has only one
 * index per column, since it always lands among the Done Tasks.
 */
export function keyboardStep(
  tasks: Task[],
  taskId: string,
  places: Place[],
  drop: KeyboardDrop,
  key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
): KeyboardDrop {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || places.length === 0) return drop;
  const placeIndex = clamp(
    drop.placeIndex + (key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0),
    0,
    places.length - 1,
  );
  const index = clamp(
    drop.index + (key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0),
    0,
    lastKeyboardIndex(tasks, task, places[placeIndex]),
  );
  return { placeIndex, index };
}

/** What a keyboard drop is dropped on, so that `whereDropLands` puts the Task at that index. */
export function keyboardTarget(tasks: Task[], taskId: string, place: Place, index: number): DropTarget {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.done) return { place };
  const { unfinished } = columnContents(tasks, place);
  // In its own column a Task takes the place in the order of the Task it's on; elsewhere it goes before it.
  const list = isInPlace(task, place) ? unfinished : unfinished.filter((t) => t.id !== taskId);
  const at = list[index];
  return at ? { taskId: at.id } : { place };
}

function lastKeyboardIndex(tasks: Task[], task: Task, place: Place): number {
  if (task.done) return 0;
  const { unfinished } = columnContents(tasks, place);
  return isInPlace(task, place) ? unfinished.length - 1 : unfinished.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
