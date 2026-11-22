import { act, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import type { Task } from "../backend/backend";
import { renderSignedIn, setToday } from "../test/renderApp";

const MONDAY = "Monday, 23 November 2026";

function column(name: string) {
  return screen.getByRole("group", { name });
}

function tasksIn(name: string) {
  return within(column(name))
    .queryAllByRole("listitem")
    .map((item) => item.textContent);
}

function categoryNames() {
  return within(screen.getByRole("region", { name: "Category row" }))
    .queryAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

/** A Task as another device would save it. */
function aTask(fields: Partial<Task> & Pick<Task, "id" | "title" | "position">): Task {
  return { notes: null, deadline: null, tags: [], done: false, doneAt: null, day: null, categoryId: null, ...fields };
}

beforeEach(() => {
  setToday(2026, 11, 23); // Monday 23 November 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("changes from another device", () => {
  it("shows a Task added on another device without reloading", async () => {
    const { backend } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });

    await act(() =>
      backend.createTask(aTask({ id: "remote-1", title: "Buy stamps", day: "2026-11-23", position: "a5" })),
    );

    expect(tasksIn(MONDAY)).toEqual(["Call mum", "Buy stamps"]);
  });

  it("shows a Task edited on another device without reloading", async () => {
    const { backend } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Buy stamps", day: "2026-11-23" },
      ],
    });

    await act(() => backend.updateTask("task-1", { title: "Call mum and dad", tags: ["family"] }));

    expect(tasksIn(MONDAY)).toEqual(["Call mum and dadfamily", "Buy stamps"]);
  });

  it("removes a Task deleted on another device without reloading", async () => {
    const { backend } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Buy stamps", day: "2026-11-23" },
      ],
    });

    await act(() => backend.deleteTask("task-1"));

    expect(tasksIn(MONDAY)).toEqual(["Buy stamps"]);
  });

  it("shows a Category renamed on another device without reloading", async () => {
    const { backend } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }],
      tasks: [{ title: "Milk", category: "Groceries" }],
    });

    await act(() => backend.renameCategory("category-1", "Shopping"));

    expect(categoryNames()).toEqual(["Shopping", "School"]);
    expect(tasksIn("Shopping")).toEqual(["Milk"]);
  });

  it("removes a Category, and its Tasks, deleted on another device without reloading", async () => {
    const { backend } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }],
      tasks: [
        { title: "Milk", category: "Groceries" },
        { title: "Read chapter 3", category: "School" },
      ],
    });

    await act(() => backend.deleteCategory("category-1"));

    expect(categoryNames()).toEqual(["School"]);
    expect(screen.queryByText("Milk")).not.toBeInTheDocument();
  });

  it("follows Settings changed on another device without reloading", async () => {
    const { backend } = await renderSignedIn({ settings: { dayCount: 7, theme: "light" } });

    await act(() => backend.updateSettings({ dayCount: 5, theme: "dark" }));

    const dayRow = screen.getByRole("region", { name: "Day row" });
    expect(within(dayRow).getAllByRole("heading", { level: 2 })).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Show 5 days" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});

describe("a save that fails", () => {
  it("puts a rejected tick back and says the change wasn't saved", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Buy stamps", day: "2026-11-23" },
      ],
    });
    backend.rejectNextSave();

    await user.click(screen.getByRole("checkbox", { name: "Done: Call mum" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save your change");
    expect(screen.getByRole("checkbox", { name: "Done: Call mum" })).not.toBeChecked();
    expect(tasksIn(MONDAY)).toEqual(["Call mum", "Buy stamps"]);
    expect((await backend.getTasks()).find((t) => t.title === "Call mum")!.done).toBe(false);
  });

  it("brings back a Category, and its Tasks, whose delete was rejected", async () => {
    const { user, backend } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }],
      tasks: [
        { title: "Milk", category: "Groceries" },
        { title: "Eggs", category: "Groceries" },
      ],
    });
    backend.rejectNextSave();

    await user.click(screen.getByRole("button", { name: "More actions for Groceries" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete Groceries and its 2 tasks?" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save your change");
    await vi.waitFor(() => expect(categoryNames()).toEqual(["Groceries", "School"]));
    expect(tasksIn("Groceries")).toEqual(["Milk", "Eggs"]);
  });

  it("puts back a rejected Settings change", async () => {
    const { user, backend } = await renderSignedIn({ settings: { dayCount: 7 } });
    backend.rejectNextSave();

    await user.click(screen.getByRole("button", { name: "Show 5 days" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save your change");
    expect(screen.getByRole("button", { name: "Show 7 days" })).toHaveAttribute("aria-pressed", "true");
    expect(await backend.getSettings()).toMatchObject({ dayCount: 7 });
  });

  it("lets the message be dismissed", async () => {
    const { user, backend } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });
    backend.rejectNextSave();
    await user.click(screen.getByRole("checkbox", { name: "Done: Call mum" }));
    const message = await screen.findByRole("alert");

    await user.click(within(message).getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
