import { screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { reloadApp, renderSignedIn, setToday } from "../test/renderApp";

function dayHeaders() {
  const dayRow = screen.getByRole("region", { name: "Day row" });
  return within(dayRow)
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

beforeEach(() => {
  setToday(2026, 11, 23); // Monday 23 November 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Day row", () => {
  it("opens at Today with 7 days by default", async () => {
    await renderSignedIn();

    expect(dayHeaders()).toEqual(["Mon 23", "Tue 24", "Wed 25", "Thu 26", "Fri 27", "Sat 28", "Sun 29"]);
    expect(screen.getByRole("heading", { name: "Mon 23" })).toHaveAttribute("aria-current", "date");
    expect(screen.getByRole("heading", { name: "Tue 24" })).not.toHaveAttribute("aria-current");
  });

  it("labels Today's column, and only Today's", async () => {
    await renderSignedIn();

    const today = screen.getByRole("group", { name: "Monday, 23 November 2026" });
    expect(within(today).getByText("Today")).toBeInTheDocument();
    const tomorrow = screen.getByRole("group", { name: "Tuesday, 24 November 2026" });
    expect(within(tomorrow).queryByText("Today")).not.toBeInTheDocument();
  });

  it("shows the month and year of the Day row's first day in the bottom bar", async () => {
    const { user } = await renderSignedIn({ settings: { dayCount: 5 } });
    const bottomBar = screen.getByRole("contentinfo");

    expect(within(bottomBar).getByText("November 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Forward 7 days" }));
    await user.click(screen.getByRole("button", { name: "Forward 1 day" }));
    expect(within(bottomBar).getByText("December 2026")).toBeInTheDocument();
  });

  it("has no top bar: the logo and navigation are in the bottom bar", async () => {
    await renderSignedIn();
    const bottomBar = screen.getByRole("contentinfo");

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(within(bottomBar).getByRole("img", { name: "Munus Vitae" })).toBeInTheDocument();
    expect(within(bottomBar).getByRole("button", { name: "Today" })).toBeInTheDocument();
    expect(within(bottomBar).getByRole("button", { name: "Show 5 days" })).toBeInTheDocument();
    expect(within(bottomBar).getByRole("button", { name: /Switch to (dark|light) theme/ })).toBeInTheDocument();
  });

  it("shows the saved number of days", async () => {
    await renderSignedIn({ settings: { dayCount: 5 } });

    expect(dayHeaders()).toEqual(["Mon 23", "Tue 24", "Wed 25", "Thu 26", "Fri 27"]);
  });

  it("moves one day at a time with ◀ and ▶", async () => {
    const { user } = await renderSignedIn({ settings: { dayCount: 5 } });

    await user.click(screen.getByRole("button", { name: "Back 1 day" }));
    expect(dayHeaders()).toEqual(["Sun 22", "Mon 23", "Tue 24", "Wed 25", "Thu 26"]);

    await user.click(screen.getByRole("button", { name: "Forward 1 day" }));
    await user.click(screen.getByRole("button", { name: "Forward 1 day" }));
    expect(dayHeaders()).toEqual(["Tue 24", "Wed 25", "Thu 26", "Fri 27", "Sat 28"]);
  });

  it("moves 7 days at a time with « and », whatever the day count", async () => {
    const { user } = await renderSignedIn({ settings: { dayCount: 5 } });

    await user.click(screen.getByRole("button", { name: "Forward 7 days" }));
    expect(dayHeaders()).toEqual(["Mon 30", "Tue 1", "Wed 2", "Thu 3", "Fri 4"]);

    await user.click(screen.getByRole("button", { name: "Back 7 days" }));
    await user.click(screen.getByRole("button", { name: "Back 7 days" }));
    expect(dayHeaders()).toEqual(["Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20"]);
  });

  it("returns to Today with the Today button", async () => {
    const { user } = await renderSignedIn({ settings: { dayCount: 5 } });

    await user.click(screen.getByRole("button", { name: "Forward 7 days" }));
    await user.click(screen.getByRole("button", { name: "Today" }));

    expect(dayHeaders()[0]).toBe("Mon 23");
  });

  it("changes and saves the number of days", async () => {
    const { user, backend, unmount } = await renderSignedIn();

    expect(screen.getByRole("button", { name: "Show 7 days" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Show 6 days" }));

    expect(dayHeaders()).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Show 6 days" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Show 7 days" })).toHaveAttribute("aria-pressed", "false");
    await vi.waitFor(async () => expect((await backend.getSettings()).dayCount).toBe(6));

    unmount();
    await reloadApp(backend);
    expect(dayHeaders()).toHaveLength(6);
  });

  it("always opens at Today, even after scrolling away", async () => {
    const { user, backend, unmount } = await renderSignedIn();

    await user.click(screen.getByRole("button", { name: "Forward 7 days" }));
    unmount();
    await reloadApp(backend);

    expect(dayHeaders()[0]).toBe("Mon 23");
  });
});

describe("theme toggle", () => {
  it("follows the system until pressed, then saves the choice", async () => {
    const { user, backend } = await renderSignedIn();
    expect((await backend.getSettings()).theme).toBeNull();

    // The test environment reports a light system theme.
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
    await vi.waitFor(async () => expect((await backend.getSettings()).theme).toBe("dark"));

    await user.click(screen.getByRole("button", { name: "Switch to light theme" }));
    await vi.waitFor(async () => expect((await backend.getSettings()).theme).toBe("light"));
  });

  it("uses the saved theme over the system's", async () => {
    await renderSignedIn({ settings: { theme: "dark" } });

    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });
});
