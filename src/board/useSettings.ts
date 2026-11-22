import { useCallback, useEffect, useState } from "react";
import type { Settings } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";

/**
 * Loads the user's Settings and saves changes. Changes show immediately;
 * handling a failed save comes with ticket 09.
 */
export function useSettings() {
  const backend = useBackend();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    backend.getSettings().then((loaded) => {
      if (active) setSettings(loaded);
    });
    return () => {
      active = false;
    };
  }, [backend]);

  const updateSettings = useCallback(
    (changes: Partial<Settings>) => {
      setSettings((current) => (current ? { ...current, ...changes } : current));
      void backend.updateSettings(changes);
    },
    [backend],
  );

  return { settings, updateSettings };
}
