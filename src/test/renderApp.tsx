import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "../App";
import type { Backend } from "../backend/backend";
import { createInMemoryBackend } from "../backend/inMemoryBackend";

export function renderApp(backend: Backend = createInMemoryBackend()) {
  const user = userEvent.setup();
  const view = render(<App backend={backend} />);
  return { user, backend, ...view };
}

/** Renders the app already signed in and waits for the Day row to appear. */
export async function renderSignedIn(
  options: Parameters<typeof createInMemoryBackend>[0] = {},
) {
  const backend = createInMemoryBackend({ signedInAs: { name: "Ada Lovelace" }, ...options });
  const result = renderApp(backend);
  await waitForBoard();
  return result;
}

/** Renders the app again against an existing backend, as after a page reload. */
export async function reloadApp(backend: Backend) {
  const result = renderApp(backend);
  await waitForBoard();
  return result;
}

/** Waits until both the Day row and the Category row have loaded. */
async function waitForBoard() {
  await screen.findByRole("region", { name: "Day row" });
  await screen.findAllByRole("heading", { level: 2 });
  await screen.findByRole("button", { name: "+ Add category" });
}

/**
 * Fakes only the clock (not timers), so Today is fixed while user-event and
 * findBy* keep working. Month is 1-based here, unlike Date.
 */
export function setToday(year: number, month: number, day: number, hour = 10) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(year, month - 1, day, hour));
}
