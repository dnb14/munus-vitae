import { act, fireEvent, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import type { Backend } from "../backend/backend";
import { renderSignedIn, setToday } from "../test/renderApp";

const SUNDAY = "Sunday, 22 November 2026";
const MONDAY = "Monday, 23 November 2026";

function column(name: string) {
  return screen.getByRole("group", { name });
}

function tasksIn(name: string) {
  return within(column(name))
    .queryAllByRole("listitem")
    .map((item) => item.textContent);
}

async function savedTask(backend: Backend, title: string) {
  return (await backend.getTasks()).find((t) => t.title === title)!;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Rollover on load", () => {
  it("moves unfinished Tasks from 3 missed days into Today, after Today's own, keeping their order", async () => {
    setToday(2026, 11, 23); // Monday
    const { backend } = await renderSignedIn({
      tasks: [
        { title: "Today first", day: "2026-11-23" },
        { title: "Friday", day: "2026-11-20" },
        { title: "Saturday A", day: "2026-11-21" },
        { title: "Today second", day: "2026-11-23" },
        { title: "Saturday B", day: "2026-11-21" },
        { title: "Sunday", day: "2026-11-22" },
        { title: "Today done", day: "2026-11-23", doneAt: "2026-11-23T08:00:00.000Z" },
      ],
    });

    await vi.waitFor(() =>
      expect(tasksIn(MONDAY)).toEqual([
        "Today first",
        "Today second",
        "Friday",
        "Saturday A",
        "Saturday B",
        "Sunday",
        "Today done",
      ]),
    );
    for (const title of ["Friday", "Saturday A", "Saturday B", "Sunday"]) {
      expect((await savedTask(backend, title)).day).toBe("2026-11-23");
    }
  });

  it("leaves Done Tasks on their Past day as history", async () => {
    setToday(2026, 11, 23);
    const { backend, user } = await renderSignedIn({
      tasks: [
        { title: "Finished", day: "2026-11-22", doneAt: "2026-11-22T09:00:00.000Z" },
        { title: "Unfinished", day: "2026-11-22" },
      ],
    });

    await vi.waitFor(() => expect(tasksIn(MONDAY)).toEqual(["Unfinished"]));
    expect((await savedTask(backend, "Finished")).day).toBe("2026-11-22");

    await user.click(screen.getByRole("button", { name: "Back 1 day" }));
    expect(tasksIn(SUNDAY)).toEqual(["Finished"]);
  });

  it("leaves Tasks in Categories and on future days alone", async () => {
    setToday(2026, 11, 23);
    const { backend } = await renderSignedIn({
      categories: [{ name: "Errands" }],
      tasks: [
        { title: "Buy milk", category: "Errands" },
        { title: "Gym", day: "2026-11-24" },
      ],
    });

    expect(tasksIn("Errands")).toEqual(["Buy milk"]);
    expect(tasksIn("Tuesday, 24 November 2026")).toEqual(["Gym"]);
    expect((await savedTask(backend, "Gym")).day).toBe("2026-11-24");
  });
});

describe("Rollover with the app open", () => {
  it("rolls over when the clock passes midnight, without reloading", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date(2026, 10, 22, 23, 50)); // Sunday, ten to midnight
    const { backend } = await renderSignedIn({
      tasks: [
        { title: "Read", day: "2026-11-22" },
        { title: "Swept", day: "2026-11-22", doneAt: "2026-11-22T09:00:00.000Z" },
        { title: "Gym", day: "2026-11-23" },
      ],
    });
    expect(tasksIn(SUNDAY)).toEqual(["Read", "Swept"]);

    act(() => vi.advanceTimersByTime(20 * 60 * 1000));

    await vi.waitFor(() => expect(tasksIn(MONDAY)).toEqual(["Gym", "Read"]));
    expect(screen.getByRole("heading", { name: "Mon 23" })).toHaveAttribute("aria-current", "date");
    expect((await savedTask(backend, "Read")).day).toBe("2026-11-23");
    expect((await savedTask(backend, "Swept")).day).toBe("2026-11-22");
  });

  it("notices a new day when the window regains focus", async () => {
    setToday(2026, 11, 22, 23);
    await renderSignedIn({ tasks: [{ title: "Read", day: "2026-11-22" }] });

    vi.setSystemTime(new Date(2026, 10, 23, 7));
    fireEvent.focus(window);

    await vi.waitFor(() => expect(tasksIn(MONDAY)).toEqual(["Read"]));
  });
});

describe("Past days are read-only", () => {
  async function showingYesterday() {
    setToday(2026, 11, 23);
    const result = await renderSignedIn({
      tasks: [
        { title: "Finished", day: "2026-11-22", doneAt: "2026-11-22T09:00:00.000Z", notes: "Went well" },
        { title: "Gym", day: "2026-11-23" },
      ],
    });
    await result.user.click(screen.getByRole("button", { name: "Back 1 day" }));
    return result;
  }

  it("has no empty Lines to click", async () => {
    await showingYesterday();

    expect(within(column(SUNDAY)).queryByRole("button", { name: "Add a task" })).toBeNull();
    expect(within(column(MONDAY)).getAllByRole("button", { name: "Add a task" }).length).toBeGreaterThan(0);
  });

  it("has no checkboxes, so its Tasks can't be unticked", async () => {
    await showingYesterday();

    expect(within(column(SUNDAY)).queryByRole("checkbox")).toBeNull();
    expect(within(column(MONDAY)).getByRole("checkbox", { name: "Done: Gym" })).toBeInTheDocument();
  });

  it("can't drag its Tasks out", async () => {
    await showingYesterday();

    expect(screen.queryByRole("button", { name: "Move Finished" })).toBeNull();
  });

  it("rejects drops", async () => {
    const { user, backend } = await showingYesterday();

    // Sunday is first in the row; one step left from Monday would be Sunday.
    screen.getByRole("button", { name: "Move Gym" }).focus();
    await user.keyboard("[Space]");
    await user.keyboard("{ArrowLeft}");
    await user.keyboard("[Space]");

    expect(tasksIn(SUNDAY)).toEqual(["Finished"]);
    expect(tasksIn(MONDAY)).toEqual(["Gym"]);
    expect((await savedTask(backend, "Gym")).day).toBe("2026-11-23");
  });

  it("opens the editor read-only for its Tasks", async () => {
    const { user } = await showingYesterday();

    await user.click(screen.getByRole("button", { name: "View Finished" }));

    const dialog = screen.getByRole("dialog", { name: "Task details" });
    expect(within(dialog).getByLabelText("Title")).toHaveAttribute("readonly");
    expect(within(dialog).getByLabelText("Notes")).toHaveValue("Went well");
    expect(within(dialog).getByLabelText("Notes")).toHaveAttribute("readonly");
    expect(within(dialog).getByLabelText("Deadline")).toBeDisabled();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).toBeNull();
    expect(within(dialog).queryByLabelText("Add tag")).toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
