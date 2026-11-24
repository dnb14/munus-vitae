import type { ReactNode } from "react";
import type { DayCount, Theme } from "../backend/backend";
import { monthYearLabel, type CalendarDate } from "./dates";
import { ChevronLeft, ChevronRight, DoubleChevronLeft, DoubleChevronRight, Logo, Moon, Sun } from "./icons";

export type Navigation = {
  /** The Day row's first day. */
  start: CalendarDate;
  moveDays(days: number): void;
  goToToday(): void;
  dayCount: DayCount;
  setDayCount(dayCount: DayCount): void;
  theme: Theme;
  toggleTheme(): void;
};

const DAY_COUNTS: DayCount[] = [5, 6, 7];

type Props = {
  navigation: Navigation | null;
  /** The Tag the page is filtered by, or null. */
  activeTag: string | null;
  onClearTag(): void;
};

/** The bottom bar: the month and Day row navigation on the left, the logo in the centre, the day count and theme on the right. */
export function BottomBar({ navigation, activeTag, onClearTag }: Props) {
  return (
    <footer className="bar bar--bottom">
      {navigation && (
        <>
          <div className="bar__start">
            <span className="bar__month">{monthYearLabel(navigation.start)}</span>
            <nav className="bar__group" aria-label="Day row navigation">
              <IconButton label="Back 7 days" onClick={() => navigation.moveDays(-7)}>
                <DoubleChevronLeft />
              </IconButton>
              <IconButton label="Back 1 day" onClick={() => navigation.moveDays(-1)}>
                <ChevronLeft />
              </IconButton>
              <button type="button" className="button button--quiet" onClick={navigation.goToToday}>
                Today
              </button>
              <IconButton label="Forward 1 day" onClick={() => navigation.moveDays(1)}>
                <ChevronRight />
              </IconButton>
              <IconButton label="Forward 7 days" onClick={() => navigation.moveDays(7)}>
                <DoubleChevronRight />
              </IconButton>
            </nav>
            {activeTag !== null && (
              <div className="active-tag" role="group" aria-label="Tag filter">
                <span className="active-tag__name">#{activeTag}</span>
                <button
                  type="button"
                  className="active-tag__clear"
                  aria-label="Clear tag filter"
                  title="Clear tag filter"
                  onClick={onClearTag}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="bar__centre">
            <Logo />
          </div>

          <div className="bar__end">
            <div className="segmented" role="group" aria-label="Days shown">
              {DAY_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className="segmented__option"
                  aria-label={`Show ${count} days`}
                  aria-pressed={navigation.dayCount === count}
                  onClick={() => navigation.setDayCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
            <IconButton
              label={navigation.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              onClick={navigation.toggleTheme}
            >
              {navigation.theme === "dark" ? <Sun /> : <Moon />}
            </IconButton>
          </div>
        </>
      )}
    </footer>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick(): void; children: ReactNode }) {
  return (
    <button type="button" className="button button--quiet button--icon" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}
