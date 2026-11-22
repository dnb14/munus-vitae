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

/** Every empty Line in a column, top to bottom. */
function emptyLines(name: string) {
  return within(column(name)).queryAllByRole("button", { name: "Add a task" });
}

beforeEach(() => {
  setToday(2026, 11, 23); // Monday 23 November 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("adding a Task", () => {
  it("adds a Task to a Day column by clicking an empty Line, and keeps it after a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn();

    await user.click(emptyLines(MONDAY)[0]);
    await user.keyboard("Buy stamps{Enter}");

    expect(tasksIn(MONDAY)).toEqual(["Buy stamps"]);
    await vi.waitFor(async () =>
      expect((await backend.getTasks()).map((t) => [t.title, t.day, t.categoryId])).toEqual([
        ["Buy stamps", "2026-11-23", null],
      ]),
    );

    unmount();
    await reloadApp(backend);
    expect(tasksIn(MONDAY)).toEqual(["Buy stamps"]);
  });

  it("adds a Task to a Category", async () => {
    const { user, backend } = await renderSignedIn({ categories: [{ name: "Groceries" }] });

    await user.click(emptyLines("Groceries")[0]);
    await user.keyboard("Milk{Enter}");

    expect(tasksIn("Groceries")).toEqual(["Milk"]);
    const [groceries] = await backend.getCategories();
    await vi.waitFor(async () =>
      expect((await backend.getTasks()).map((t) => [t.title, t.day, t.categoryId])).toEqual([
        ["Milk", null, groceries.id],
      ]),
    );
  });

  it("snaps to the Line right after the last Task, wherever I click", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: [{ title: "Call mum", day: "2026-11-23" }],
    });

    const lines = emptyLines(MONDAY);
    expect(lines.length).toBeGreaterThan(1);
    await user.click(lines[lines.length - 1]);

    // The input sits on the Line straight after "Call mum", above every empty Line.
    const input = screen.getByRole("textbox", { name: "New task" });
    const callMum = within(column(MONDAY)).getByText("Call mum");
    expect(callMum.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const line of emptyLines(MONDAY)) {
      expect(input.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    await user.keyboard("Water plants{Enter}");
    expect(tasksIn(MONDAY)).toEqual(["Call mum", "Water plants"]);
    await vi.waitFor(async () => expect(await backend.getTasks()).toHaveLength(2));
  });

  it("keeps the input open after Enter so I can type several Tasks in a row, in order", async () => {
    const { user, backend, unmount } = await renderSignedIn();

    await user.click(emptyLines(MONDAY)[0]);
    await user.keyboard("One{Enter}Two{Enter}Three{Enter}");

    expect(tasksIn(MONDAY)).toEqual(["One", "Two", "Three"]);
    expect(screen.getByRole("textbox", { name: "New task" })).toHaveValue("");
    await vi.waitFor(async () => expect(await backend.getTasks()).toHaveLength(3));

    unmount();
    await reloadApp(backend);
    expect(tasksIn(MONDAY)).toEqual(["One", "Two", "Three"]);
  });

  it("fills a column with Lines and, once full, keeps exactly one empty Line below the Tasks", async () => {
    const titles = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
    const { user } = await renderSignedIn({
      tasks: titles.slice(0, 7).map((title) => ({ title, day: "2026-11-23" })),
    });

    expect(emptyLines("Tuesday, 24 November 2026").length).toBeGreaterThan(1); // an empty day is ruled to its height
    expect(tasksIn(MONDAY)).toEqual(titles.slice(0, 7));
    expect(emptyLines(MONDAY)).toHaveLength(1);

    await user.click(emptyLines(MONDAY)[0]);
    await user.keyboard("Eight{Enter}{Escape}");
    expect(tasksIn(MONDAY)).toEqual(titles);
    expect(emptyLines(MONDAY)).toHaveLength(1);
  });

  it("cancels with Escape", async () => {
    const { user, backend } = await renderSignedIn();

    await user.click(emptyLines(MONDAY)[0]);
    await user.keyboard("Nope{Escape}");

    expect(screen.queryByRole("textbox", { name: "New task" })).not.toBeInTheDocument();
    expect(tasksIn(MONDAY)).toEqual([]);
    expect(await backend.getTasks()).toEqual([]);
  });

  it("cancels when I press Enter or leave the input with nothing typed", async () => {
    const { user, backend } = await renderSignedIn();

    await user.click(emptyLines(MONDAY)[0]);
    await user.keyboard("   {Enter}");
    expect(screen.queryByRole("textbox", { name: "New task" })).not.toBeInTheDocument();

    await user.click(emptyLines(MONDAY)[0]);
    await user.click(screen.getByRole("heading", { name: "Mon 23" }));
    expect(screen.queryByRole("textbox", { name: "New task" })).not.toBeInTheDocument();

    expect(tasksIn(MONDAY)).toEqual([]);
    expect(await backend.getTasks()).toEqual([]);
  });
});

describe("leaving the new-Task input", () => {
  it("saves what I typed when I click away", async () => {
    const { user, backend } = await renderSignedIn();

    await user.click(emptyLines(MONDAY)[0]);
    await user.keyboard("Post letter");
    await user.click(screen.getByRole("heading", { name: "Mon 23" }));

    expect(screen.queryByRole("textbox", { name: "New task" })).not.toBeInTheDocument();
    expect(tasksIn(MONDAY)).toEqual(["Post letter"]);
    await vi.waitFor(async () => expect((await backend.getTasks()).map((t) => t.title)).toEqual(["Post letter"]));
  });
});

describe("hidden days", () => {
  it("keeps Tasks on days hidden by a smaller day count and shows them again", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: [{ title: "Hike", day: "2026-11-29" }],
    });
    const SUNDAY = "Sunday, 29 November 2026";
    expect(tasksIn(SUNDAY)).toEqual(["Hike"]);

    await user.click(screen.getByRole("button", { name: "Show 5 days" }));
    expect(screen.queryByRole("group", { name: SUNDAY })).not.toBeInTheDocument();
    expect(screen.queryByText("Hike")).not.toBeInTheDocument();
    expect((await backend.getTasks()).map((t) => t.title)).toEqual(["Hike"]);

    await user.click(screen.getByRole("button", { name: "Show 7 days" }));
    expect(tasksIn(SUNDAY)).toEqual(["Hike"]);
  });
});

describe("deleting a Category with Tasks", () => {
  async function openDelete(user: Awaited<ReturnType<typeof renderSignedIn>>["user"], name: string) {
    await user.click(within(column(name)).getByRole("button", { name: `More actions for ${name}` }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
  }

  it("asks first, naming the Task count; confirming deletes the Category and its Tasks", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }],
      tasks: [
        { title: "Milk", category: "Groceries" },
        { title: "Eggs", category: "Groceries" },
        { title: "Read chapter 3", category: "School" },
      ],
    });

    await openDelete(user, "Groceries");
    const dialog = screen.getByRole("alertdialog", { name: "Delete Groceries and its 2 tasks?" });
    expect(screen.getByRole("group", { name: "Groceries" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Groceries" })).not.toBeInTheDocument();
    expect(screen.queryByText("Milk")).not.toBeInTheDocument();
    await vi.waitFor(async () =>
      expect((await backend.getTasks()).map((t) => t.title)).toEqual(["Read chapter 3"]),
    );
    expect((await backend.getCategories()).map((c) => c.name)).toEqual(["School"]);

    unmount();
    await reloadApp(backend);
    expect(screen.queryByRole("group", { name: "Groceries" })).not.toBeInTheDocument();
    expect(tasksIn("School")).toEqual(["Read chapter 3"]);
  });

  it("uses the singular for one Task", async () => {
    const { user } = await renderSignedIn({
      categories: [{ name: "School" }],
      tasks: [{ title: "Read chapter 3", category: "School" }],
    });

    await openDelete(user, "School");
    expect(screen.getByRole("alertdialog", { name: "Delete School and its 1 task?" })).toBeInTheDocument();
  });

  it("cancelling keeps the Category and its Tasks", async () => {
    const { user, backend } = await renderSignedIn({
      categories: [{ name: "Groceries" }],
      tasks: [{ title: "Milk", category: "Groceries" }],
    });

    await openDelete(user, "Groceries");
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(tasksIn("Groceries")).toEqual(["Milk"]);
    expect((await backend.getCategories()).map((c) => c.name)).toEqual(["Groceries"]);
    expect((await backend.getTasks()).map((t) => t.title)).toEqual(["Milk"]);
  });

  it("Escape cancels too", async () => {
    const { user, backend } = await renderSignedIn({
      categories: [{ name: "Groceries" }],
      tasks: [{ title: "Milk", category: "Groceries" }],
    });

    await openDelete(user, "Groceries");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(tasksIn("Groceries")).toEqual(["Milk"]);
    expect(await backend.getTasks()).toHaveLength(1);
  });
});
