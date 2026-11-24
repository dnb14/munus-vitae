/**
 * Calendar dates as local "YYYY-MM-DD" strings. A date here is a day on the
 * user's calendar, not an instant, so all arithmetic uses local date parts.
 */
export type CalendarDate = string;

export function toCalendarDate(date: Date): CalendarDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalDate(date: CalendarDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Today: the current date on this device's clock. */
export function today(): CalendarDate {
  return toCalendarDate(new Date());
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const local = toLocalDate(date);
  local.setDate(local.getDate() + days);
  return toCalendarDate(local);
}

/** The two parts of a Day column's header, e.g. { weekday: "Mon", day: 23 }: read as "Mon 23". */
export function dayColumnLabel(date: CalendarDate): { weekday: string; day: number } {
  const local = toLocalDate(date);
  return { weekday: local.toLocaleDateString("en-US", { weekday: "short" }), day: local.getDate() };
}

/** Month and year, e.g. "November 2026". */
export function monthYearLabel(date: CalendarDate): string {
  return toLocalDate(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Full date for screen readers, e.g. "Monday, 23 November 2026". */
export function dayColumnFullLabel(date: CalendarDate): string {
  const local = toLocalDate(date);
  return local.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Deadline badge text, e.g. "26 Nov". */
export function deadlineLabel(date: CalendarDate): string {
  return toLocalDate(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
