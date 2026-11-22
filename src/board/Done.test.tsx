import { screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { reloadApp, renderSignedIn, setToday } from "../test/renderApp";

const MONDAY = "Monday, 23 November 2026";

function column(name: string) {
  return screen.getByRole("group", { name });
}

function tasksIn(name: string) {
  return within(column(name))
    .queryAllByRole("listitem")
    .map((item) => item.textContent);
}

function doneBox(title: string) {
  return screen.getByRole("checkbox", { name: `Done: ${title}` });
}

beforeEach(() => {
  setToday(2026, 11, 23); // Monday 23 November 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ticking a Task", () => {
  it("marks it Done, moves it below the unfinished Tasks, and keeps it after a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Buy stamps", day: "2026-11-23" },
        { title: "Water plants", day: "2026-11-23" },
      ],
    });
    expect(doneBox("Call mum")).not.toBeChecked();

    await user.click(doneBox("Call mum"));

    expect(doneBox("Call mum")).toBeChecked();
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Water plants", "Call mum"]);
    await vi.waitFor(async () => {
      const callMum = (await backend.getTasks()).find((t) => t.title === "Call mum")!;
      expect(callMum.done).toBe(true);
      expect(callMum.doneAt).toBe(new Date(2026, 10, 23, 10).toISOString());
    });

    unmount();
    await reloadApp(backend);
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Water plants", "Call mum"]);
    expect(doneBox("Call mum")).toBeChecked();
  });
});

describe("the order of Done Tasks", () => {
  it("orders Done Tasks by when they were ticked, oldest first, even within the same moment", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      tasks: ["One", "Two", "Three", "Four"].map((title) => ({ title, day: "2026-11-23" })),
    });

    await user.click(doneBox("Three"));
    await user.click(doneBox("One"));
    vi.setSystemTime(new Date(2026, 10, 23, 11));
    await user.click(doneBox("Two"));

    expect(tasksIn(MONDAY)).toEqual(["Four", "Three", "One", "Two"]);
    await vi.waitFor(async () => expect((await backend.getTasks()).filter((t) => t.done)).toHaveLength(3));

    unmount();
    await reloadApp(backend);
    expect(tasksIn(MONDAY)).toEqual(["Four", "Three", "One", "Two"]);
  });

  it("orders saved Done Tasks by when they were Done, not by position", async () => {
    await renderSignedIn({
      categories: [{ name: "Groceries" }],
      tasks: [
        { title: "Milk", category: "Groceries", doneAt: "2026-11-23T09:00:00.000Z" },
        { title: "Eggs", category: "Groceries", doneAt: "2026-11-22T09:00:00.000Z" },
        { title: "Bread", category: "Groceries" },
      ],
    });

    expect(tasksIn("Groceries")).toEqual(["Bread", "Eggs", "Milk"]);
    expect(doneBox("Eggs")).toBeChecked();
    expect(doneBox("Bread")).not.toBeChecked();
  });

  it("compares when they were Done as moments in time, whatever the timestamp format", async () => {
    await renderSignedIn({
      categories: [{ name: "Groceries" }],
      tasks: [
        { title: "Milk", category: "Groceries", doneAt: "2026-11-23T09:30:00.000Z" },
        // 08:00 UTC, written with an offset as the database might return it.
        { title: "Eggs", category: "Groceries", doneAt: "2026-11-23T10:00:00+02:00" },
      ],
    });

    expect(tasksIn("Groceries")).toEqual(["Eggs", "Milk"]);
  });
});

describe("unticking a Task", () => {
  it("puts it back at the end of the unfinished Tasks", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23", doneAt: "2026-11-23T08:00:00.000Z" },
        { title: "Buy stamps", day: "2026-11-23" },
        { title: "Water plants", day: "2026-11-23" },
        { title: "Post letter", day: "2026-11-23", doneAt: "2026-11-23T09:00:00.000Z" },
      ],
    });
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Water plants", "Call mum", "Post letter"]);

    await user.click(doneBox("Call mum"));

    expect(doneBox("Call mum")).not.toBeChecked();
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Water plants", "Call mum", "Post letter"]);
    await vi.waitFor(async () => {
      const callMum = (await backend.getTasks()).find((t) => t.title === "Call mum")!;
      expect(callMum.done).toBe(false);
      expect(callMum.doneAt).toBeNull();
    });

    // A new Task goes after it, above the Done Tasks.
    await user.click(within(column(MONDAY)).getAllByRole("button", { name: "Add a task" })[0]);
    await user.keyboard("Hoover{Enter}{Escape}");
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Water plants", "Call mum", "Hoover", "Post letter"]);
    await vi.waitFor(async () => expect(await backend.getTasks()).toHaveLength(5));

    unmount();
    await reloadApp(backend);
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Water plants", "Call mum", "Hoover", "Post letter"]);
  });

  it("ticking and unticking again lands it at the bottom of the Done Tasks", async () => {
    const { user } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Buy stamps", day: "2026-11-23" },
      ],
    });

    await user.click(doneBox("Call mum"));
    await user.click(doneBox("Buy stamps"));
    await user.click(doneBox("Call mum"));
    expect(tasksIn(MONDAY)).toEqual(["Call mum", "Buy stamps"]);
    await user.click(doneBox("Call mum"));
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps", "Call mum"]);
  });
});

describe("Clear done", () => {
  it("removes only that Category's Done Tasks", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }],
      tasks: [
        { title: "Milk", category: "Groceries", doneAt: "2026-11-22T09:00:00.000Z" },
        { title: "Eggs", category: "Groceries" },
        { title: "Bread", category: "Groceries", doneAt: "2026-11-22T10:00:00.000Z" },
        { title: "Read chapter 3", category: "School", doneAt: "2026-11-22T09:00:00.000Z" },
        { title: "Call mum", day: "2026-11-23", doneAt: "2026-11-23T08:00:00.000Z" },
      ],
    });

    await user.click(within(column("Groceries")).getByRole("button", { name: "More actions for Groceries" }));
    await user.click(screen.getByRole("menuitem", { name: "Clear done" }));

    expect(tasksIn("Groceries")).toEqual(["Eggs"]);
    expect(tasksIn("School")).toEqual(["Read chapter 3"]);
    expect(tasksIn(MONDAY)).toEqual(["Call mum"]);
    await vi.waitFor(async () =>
      expect((await backend.getTasks()).map((t) => t.title).sort()).toEqual(["Call mum", "Eggs", "Read chapter 3"]),
    );

    unmount();
    await reloadApp(backend);
    expect(tasksIn("Groceries")).toEqual(["Eggs"]);
  });
});
