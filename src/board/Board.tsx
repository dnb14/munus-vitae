import { useState } from "react";
import type { CSSProperties } from "react";
import type { User } from "../backend/backend";
import { LINE_HEIGHT } from "./boardModel";
import { CategoryRow } from "./CategoryRow";
import { addDays, today, type CalendarDate } from "./dates";
import { DayRow } from "./DayRow";
import { useEffectiveTheme } from "./theme";
import { TopBar } from "./TopBar";
import { useSettings } from "./useSettings";
import { useTasks } from "./useTasks";

/** The signed-in page: the top bar, the Day row (60%) and the Category row (40%). */
export function Board({ user }: { user: User }) {
  const { settings, updateSettings } = useSettings();
  // Today is read once per page load; ticket 10 adds the clock that notices midnight.
  const [todayDate] = useState<CalendarDate>(today);
  const [dayRowStart, setDayRowStart] = useState<CalendarDate>(todayDate);
  const theme = useEffectiveTheme(settings?.theme ?? null);
  const { tasks, createTask, forgetCategoryTasks } = useTasks();

  return (
    <div className="board" style={{ "--line-height": `${LINE_HEIGHT}px` } as CSSProperties}>
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
        {settings && tasks && (
          <DayRow
            start={dayRowStart}
            count={settings.dayCount}
            today={todayDate}
            tasks={tasks}
            onAddTask={(day, title) => createTask({ day }, title)}
          />
        )}
      </section>
      <section className="category-row" aria-label="Category row">
        {tasks && (
          <CategoryRow
            tasks={tasks}
            onAddTask={(categoryId, title) => createTask({ categoryId }, title)}
            onCategoryDeleted={forgetCategoryTasks}
          />
        )}
      </section>
    </div>
  );
}
