import type { DayCount, Theme, User } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";

export type Navigation = {
  moveDays(days: number): void;
  goToToday(): void;
  dayCount: DayCount;
  setDayCount(dayCount: DayCount): void;
  theme: Theme;
  toggleTheme(): void;
};

const DAY_COUNTS: DayCount[] = [5, 6, 7];

type Props = {
  user: User;
  navigation: Navigation | null;
  /** The Tag the page is filtered by, or null. */
  activeTag: string | null;
  onClearTag(): void;
};

export function TopBar({ user, navigation, activeTag, onClearTag }: Props) {
  const backend = useBackend();

  return (
    <header className="top-bar">
      {navigation && (
        <>
          <nav className="top-bar__group" aria-label="Day row navigation">
            <IconButton label="Back 7 days" onClick={() => navigation.moveDays(-7)}>«</IconButton>
            <IconButton label="Back 1 day" onClick={() => navigation.moveDays(-1)}>◀</IconButton>
            <button type="button" className="button button--quiet" onClick={navigation.goToToday}>
              Today
            </button>
            <IconButton label="Forward 1 day" onClick={() => navigation.moveDays(1)}>▶</IconButton>
            <IconButton label="Forward 7 days" onClick={() => navigation.moveDays(7)}>»</IconButton>
          </nav>

          <div className="top-bar__group" role="group" aria-label="Days shown">
            {DAY_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                className="button button--quiet button--toggle"
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
            {navigation.theme === "dark" ? "☀" : "☾"}
          </IconButton>
        </>
      )}

      {activeTag !== null && (
        <div className="active-tag" role="group" aria-label="Tag filter">
          <span className="active-tag__name">{activeTag}</span>
          <button type="button" className="active-tag__clear" aria-label="Clear tag filter" title="Clear tag filter" onClick={onClearTag}>
            ✕
          </button>
        </div>
      )}

      <div className="top-bar__spacer" />
      <Avatar user={user} />
      <button type="button" className="button button--quiet" onClick={() => backend.signOut()}>
        Sign out
      </button>
    </header>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick(): void; children: string }) {
  return (
    <button type="button" className="button button--quiet button--icon" aria-label={label} title={label} onClick={onClick}>
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return <img className="avatar" src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" />;
  }
  return (
    <span className="avatar avatar--initial" role="img" aria-label={user.name}>
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}
