import { useEffect, useState } from "react";
import { today, type CalendarDate } from "./dates";

/** How often the Today clock looks at the time. */
const CHECK_EVERY_MS = 30_000;

/**
 * The Today clock: the current local date, which changes when the date does.
 * It checks regularly and whenever the window regains focus or becomes
 * visible, since timers can sleep while the device does.
 */
export function useToday(): CalendarDate {
  const [date, setDate] = useState<CalendarDate>(today);

  useEffect(() => {
    // Setting the same string again doesn't re-render.
    const check = () => setDate(today());
    const interval = setInterval(check, CHECK_EVERY_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return date;
}
