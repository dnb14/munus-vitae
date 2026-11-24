import { useEffect, useState } from "react";
import { Search } from "./icons";

type Props = {
  query: string;
  onQueryChange(query: string): void;
};

/**
 * Search has no bar of its own. Pressing / while nothing has focus, or Ctrl/⌘+K
 * at any time, opens a small box in the middle of the screen. Escape clears and
 * closes it, and so does leaving it empty.
 */
export function SearchBox({ query, onQueryChange }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const commandK = event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey);
      const slash = event.key === "/" && nothingFocused();
      if (commandK || slash) {
        event.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    onQueryChange("");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="search" role="search">
      <Search />
      <input
        className="search__input"
        type="search"
        aria-label="Search"
        placeholder="Search tasks and #tags"
        value={query}
        autoFocus
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
        onBlur={() => !query && close()}
      />
      <kbd className="search__hint" aria-hidden="true">
        Esc
      </kbd>
    </div>
  );
}

/** True when the keyboard isn't in a field, button or dialog: the page itself has focus. */
function nothingFocused(): boolean {
  const active = document.activeElement;
  return !active || active === document.body || active === document.documentElement;
}
