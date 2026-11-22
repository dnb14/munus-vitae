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

/** The dates shown in the Day row: `count` consecutive days from `start`. */
export function dayRowDates(start: CalendarDate, count: number): CalendarDate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** Header text for a Day column, e.g. "Mon 23". */
export function dayColumnLabel(date: CalendarDate): string {
  const local = toLocalDate(date);
  const weekday = local.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} ${local.getDate()}`;
}

/** Full date for screen readers, e.g. "Monday 23 November 2026". */
export function dayColumnFullLabel(date: CalendarDate): string {
  const local = toLocalDate(date);
  return local.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
