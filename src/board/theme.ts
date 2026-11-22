import { useEffect, useState } from "react";
import type { Theme } from "../backend/backend";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The theme on screen: the saved choice, or the system's while none is saved. */
export function useEffectiveTheme(saved: Theme | null): Theme {
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const effective = saved ?? system;

  useEffect(() => {
    const root = document.documentElement;
    if (saved) root.dataset.theme = saved;
    else delete root.dataset.theme;
  }, [saved]);

  return effective;
}
