import { useState } from "react";
import type { User } from "../backend/backend";
import { CategoryRow } from "./CategoryRow";
import { addDays, today, type CalendarDate } from "./dates";
import { DayRow } from "./DayRow";
import { useEffectiveTheme } from "./theme";
import { TopBar } from "./TopBar";
import { useSettings } from "./useSettings";

/** The signed-in page: the top bar, the Day row (60%) and the Category row (40%). */
export function Board({ user }: { user: User }) {
  const { settings, updateSettings } = useSettings();
  // Today is read once per page load; ticket 10 adds the clock that notices midnight.
  const [todayDate] = useState<CalendarDate>(today);
  const [dayRowStart, setDayRowStart] = useState<CalendarDate>(todayDate);
  const theme = useEffectiveTheme(settings?.theme ?? null);

  return (
    <div className="board">
      <TopBar
        user={user}
        navigation={
          settings && {
            moveDays: (days) => setDayRowStart((start) => addDays(start, days)),
            goToToday: () => setDayRowStart(todayDate),
            dayCount: settings.dayCount,
            setDayCount: (dayCount) => updateSettings({ dayCount }),
            theme,
            toggleTheme: () => updateSettings({ theme: theme === "dark" ? "light" : "dark" }),
          }
        }
      />
      <section className="day-row" aria-label="Day row">
        {settings && <DayRow start={dayRowStart} count={settings.dayCount} today={todayDate} />}
      </section>
      <section className="category-row" aria-label="Category row">
        <CategoryRow />
      </section>
    </div>
  );
}
