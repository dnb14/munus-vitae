import { dayColumnFullLabel, dayColumnLabel, dayRowDates, type CalendarDate } from "./dates";

type Props = {
  start: CalendarDate;
  count: number;
  today: CalendarDate;
};

export function DayRow({ start, count, today }: Props) {
  const dates = dayRowDates(start, count);

  return (
    <div className="day-row__columns" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {dates.map((date) => {
        const isToday = date === today;
        const isPast = date < today;
        return (
          <div
            key={date}
            className={["day-column", isToday && "day-column--today", isPast && "day-column--past"]
              .filter(Boolean)
              .join(" ")}
            role="group"
            aria-label={dayColumnFullLabel(date)}
          >
            <h2 className="day-column__header" aria-current={isToday ? "date" : undefined}>
              {dayColumnLabel(date)}
            </h2>
          </div>
        );
      })}
    </div>
  );
}
