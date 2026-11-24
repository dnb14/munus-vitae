import type { Task } from "../backend/backend";
import { columnContents, dayRowDates, isPast } from "./boardModel";
import { dayColumnFullLabel, dayColumnLabel, type CalendarDate } from "./dates";
import { TaskLines, type TaskLineActions } from "./TaskLines";

type Props = {
  start: CalendarDate;
  count: number;
  today: CalendarDate;
  tasks: Task[];
  onAddTask(day: CalendarDate, title: string): void;
  taskActions: TaskLineActions;
};

export function DayRow({ start, count, today, tasks, onAddTask, taskActions }: Props) {
  const dates = dayRowDates(start, count);

  return (
    <div className="day-row__columns" style={{ gridTemplateColumns: `repeat(${count}, var(--column-width))` }}>
      {dates.map((date) => {
        const isToday = date === today;
        const past = isPast(date, today);
        const place = { day: date };
        const label = dayColumnLabel(date);
        return (
          <div
            key={date}
            className={["day-column", isToday && "day-column--today", past && "day-column--past"]
              .filter(Boolean)
              .join(" ")}
            role="group"
            aria-label={dayColumnFullLabel(date)}
          >
            <div className="day-column__header">
              {/* Reads "Mon 23"; shown as a big "23" then a small "MON". */}
              <h2 className="day-column__date" aria-current={isToday ? "date" : undefined}>
                <span className="day-column__weekday">{label.weekday}</span>{" "}
                <span className="day-column__day">{label.day}</span>
              </h2>
              {isToday && <span className="day-column__today">Today</span>}
            </div>
            <TaskLines
              place={place}
              contents={columnContents(tasks, place)}
              onAdd={(title) => onAddTask(date, title)}
              taskActions={taskActions}
              readOnly={past}
            />
          </div>
        );
      })}
    </div>
  );
}
