import { useCallback, useEffect, useState } from "react";

/** How long the "couldn't save" message stays up unless dismissed. */
const MESSAGE_MS = 6000;

/**
 * Edits show on screen before the Backend confirms them. When it rejects one,
 * the data hooks report it here; each reloads what's really saved whenever
 * `count` goes up, and the Board shows a short message.
 */
export type SaveFailures = {
  /** How many saves have been rejected since the page loaded. */
  count: number;
  /** Waits for a save; if the Backend rejects it, counts a failure. */
  watch(save: Promise<void>): void;
};

export function useSaveFailures() {
  const [count, setCount] = useState(0);
  const [showingMessage, setShowingMessage] = useState(false);

  const watch = useCallback((save: Promise<void>) => {
    save.catch((error: unknown) => {
      console.error("A save was rejected", error);
      setCount((n) => n + 1);
      setShowingMessage(true);
    });
  }, []);

  // Each new failure restarts the timer.
  useEffect(() => {
    if (!showingMessage) return;
    const timer = setTimeout(() => setShowingMessage(false), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [showingMessage, count]);

  const dismissMessage = useCallback(() => setShowingMessage(false), []);
  const failures: SaveFailures = { count, watch };

  return { failures, showingMessage, dismissMessage };
}
