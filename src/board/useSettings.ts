import { useCallback, useEffect, useState } from "react";
import type { Settings } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";
import type { SaveFailures } from "./useSaveFailures";

/**
 * Loads the user's Settings and saves changes. Changes show
 * immediately; when the Backend rejects one, `failures` counts it and this
 * reloads what is really saved.
 */
export function useSettings({ count: failureCount, watch }: SaveFailures) {
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
  }, [backend, failureCount]);

  // Merge saved changes from every device, this one included.
  useEffect(
    () =>
      backend.subscribeToChanges((change) => {
        if (change.kind === "settingsSaved") setSettings(change.settings);
      }),
    [backend],
  );

  const updateSettings = useCallback(
    (changes: Partial<Settings>) => {
      setSettings((current) => (current ? { ...current, ...changes } : current));
      watch(backend.updateSettings(changes));
    },
    [backend, watch],
  );

  return { settings, updateSettings };
}
