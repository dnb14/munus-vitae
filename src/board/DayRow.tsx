import type { Task } from "../backend/backend";
import { columnContents, dayRowDates, isPast } from "./boardModel";
import { dayColumnFullLabel, dayColumnLabel, type CalendarDate } from "./dates";
import { TaskLines } from "./TaskLines";

type Props = {
  start: CalendarDate;
  count: number;
  today: CalendarDate;
  tasks: Task[];
  onAddTask(day: CalendarDate, title: string): void;
  onSetDone(taskId: string, done: boolean): void;
};

export function DayRow({ start, count, today, tasks, onAddTask, onSetDone }: Props) {
  const dates = dayRowDates(start, count);

  return (
    <div className="day-row__columns" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {dates.map((date) => {
        const isToday = date === today;
        const past = isPast(date, today);
        const place = { day: date };
        return (
          <div
            key={date}
            className={["day-column", isToday && "day-column--today", past && "day-column--past"]
              .filter(Boolean)
              .join(" ")}
            role="group"
            aria-label={dayColumnFullLabel(date)}
          >
            <h2 className="day-column__header" aria-current={isToday ? "date" : undefined}>
              {dayColumnLabel(date)}
            </h2>
            <TaskLines
              contents={columnContents(tasks, place)}
              onAdd={(title) => onAddTask(date, title)}
              onSetDone={onSetDone}
            />
          </div>
        );
      })}
    </div>
  );
}
