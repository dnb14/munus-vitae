import { screen, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { Backend } from "../backend/backend";
import { reloadApp, renderSignedIn, setToday } from "../test/renderApp";

// Today is Monday 23 November 2026, so the Day row runs Monday to Sunday.
const MONDAY = "Monday, 23 November 2026";
const TUESDAY = "Tuesday, 24 November 2026";

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

/**
 * Moves a Task by keyboard: focus its handle, Space to pick it up, the given
 * arrow keys, Space to drop. Up and Down move within a column; Left and Right
 * step through the columns in reading order: the Day columns, then the Categories.
 */
async function keyboardMove(user: ReturnType<typeof userEvent.setup>, title: string, arrows: string) {
  screen.getByRole("button", { name: `Move ${title}` }).focus();
  await user.keyboard("[Space]");
  await user.keyboard(arrows);
  await user.keyboard("[Space]");
}

beforeEach(() => {
  setToday(2026, 11, 23);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("reordering Tasks within a column", () => {
  it("moves a Task down, rewriting only its ordering key, and keeps the order after a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      tasks: ["One", "Two", "Three"].map((title) => ({
        title,
        day: "2026-11-23",
      })),
    });
    const before = await backend.getTasks();

    await keyboardMove(user, "One", "{ArrowDown}{ArrowDown}");

    await vi.waitFor(() => expect(tasksIn(MONDAY)).toEqual(["Two", "Three", "One"]));
    await vi.waitFor(async () => expect((await savedTask(backend, "One")).position).not.toBe(before[0].position));
    expect((await savedTask(backend, "Two")).position).toBe(before[1].position);
    expect((await savedTask(backend, "Three")).position).toBe(before[2].position);

    unmount();
    await reloadApp(backend);
    expect(tasksIn(MONDAY)).toEqual(["Two", "Three", "One"]);
  });

  it("moves a Task up into the middle of a Category", async () => {
    const { user } = await renderSignedIn({
      categories: [{ name: "Errands" }],
      tasks: ["One", "Two", "Three"].map((title) => ({
        title,
        category: "Errands",
      })),
    });

    await keyboardMove(user, "Three", "{ArrowUp}");

    await vi.waitFor(() => expect(tasksIn("Errands")).toEqual(["One", "Three", "Two"]));
  });
});

describe("moving Tasks between columns", () => {
  it("Schedules a Task by moving it from a Category onto a Day column, and keeps it there after a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      categories: [{ name: "Errands" }],
      tasks: [
        { title: "Gym", day: "2026-11-24" },
        { title: "Buy milk", category: "Errands" },
        { title: "Post letter", category: "Errands" },
      ],
    });

    // Errands comes after the seven Day columns; six steps left is Tuesday, then below Gym.
    await keyboardMove(user, "Buy milk", "{ArrowLeft>6/}{ArrowDown}");

    await vi.waitFor(() => expect(tasksIn(TUESDAY)).toEqual(["Gym", "Buy milk"]));
    expect(tasksIn("Errands")).toEqual(["Post letter"]);
    await vi.waitFor(async () =>
      expect(await savedTask(backend, "Buy milk")).toMatchObject({
        day: "2026-11-24",
        categoryId: null,
      }),
    );

    unmount();
    await reloadApp(backend);
    expect(tasksIn(TUESDAY)).toEqual(["Gym", "Buy milk"]);
    expect(tasksIn("Errands")).toEqual(["Post letter"]);
  });

  it("unschedules a Task by moving it from a Day column onto a Category", async () => {
    const { user, backend } = await renderSignedIn({
      categories: [{ name: "Errands" }],
      tasks: [
        { title: "Buy milk", day: "2026-11-23" },
        { title: "Post letter", category: "Errands" },
      ],
    });

    await keyboardMove(user, "Buy milk", "{ArrowRight>7/}");

    await vi.waitFor(() => expect(tasksIn("Errands")).toEqual(["Buy milk", "Post letter"]));
    expect(tasksIn(MONDAY)).toEqual([]);
    const errands = (await backend.getCategories())[0];
    await vi.waitFor(async () =>
      expect(await savedTask(backend, "Buy milk")).toMatchObject({
        day: null,
        categoryId: errands.id,
      }),
    );
  });

  it("moves a Task to another Day column", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: [
        { title: "Gym", day: "2026-11-23" },
        { title: "Swim", day: "2026-11-24" },
      ],
    });

    await keyboardMove(user, "Gym", "{ArrowRight}");

    await vi.waitFor(() => expect(tasksIn(TUESDAY)).toEqual(["Gym", "Swim"]));
    expect(tasksIn(MONDAY)).toEqual([]);
    await vi.waitFor(async () => expect((await savedTask(backend, "Gym")).day).toBe("2026-11-24"));
  });

  it("moves a Task to another Category", async () => {
    const { user, backend } = await renderSignedIn({
      categories: [{ name: "Errands" }, { name: "Reading" }],
      tasks: [
        { title: "Dune", category: "Errands" },
        { title: "Emma", category: "Reading" },
      ],
    });

    await keyboardMove(user, "Dune", "{ArrowRight}{ArrowDown}");

    await vi.waitFor(() => expect(tasksIn("Reading")).toEqual(["Emma", "Dune"]));
    expect(tasksIn("Errands")).toEqual([]);
    const reading = (await backend.getCategories())[1];
    await vi.waitFor(async () =>
      expect(await savedTask(backend, "Dune")).toMatchObject({
        day: null,
        categoryId: reading.id,
      }),
    );
  });

  it("does nothing when a Task is dropped where it started", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: ["One", "Two"].map((title) => ({ title, day: "2026-11-23" })),
    });
    const before = await backend.getTasks();

    await keyboardMove(user, "One", "{ArrowRight}{ArrowLeft}");

    expect(tasksIn(MONDAY)).toEqual(["One", "Two"]);
    expect(await backend.getTasks()).toEqual(before);
  });

  it("cancels with Escape", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: [{ title: "Gym", day: "2026-11-23" }],
    });

    screen.getByRole("button", { name: "Move Gym" }).focus();
    await user.keyboard("[Space]{ArrowRight}{Escape}");

    expect(tasksIn(MONDAY)).toEqual(["Gym"]);
    expect((await savedTask(backend, "Gym")).day).toBe("2026-11-23");
  });
});

describe("moving a Done Task", () => {
  it("lands among the Done Tasks of the new column, ordered by when they were ticked, and stays Done", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      tasks: [
        {
          title: "Read",
          day: "2026-11-23",
          doneAt: "2026-11-23T08:00:00.000Z",
        },
        { title: "Cook", day: "2026-11-24" },
        {
          title: "Shop",
          day: "2026-11-24",
          doneAt: "2026-11-23T07:00:00.000Z",
        },
        { title: "Run", day: "2026-11-24", doneAt: "2026-11-23T09:00:00.000Z" },
      ],
    });

    // Up and Down can't put a Done Task among the unfinished ones.
    await keyboardMove(user, "Read", "{ArrowRight}{ArrowUp}");

    await vi.waitFor(() => expect(tasksIn(TUESDAY)).toEqual(["Cook", "Shop", "Read", "Run"]));
    expect(tasksIn(MONDAY)).toEqual([]);
    await vi.waitFor(async () =>
      expect(await savedTask(backend, "Read")).toMatchObject({
        day: "2026-11-24",
        done: true,
        doneAt: "2026-11-23T08:00:00.000Z",
      }),
    );

    unmount();
    await reloadApp(backend);
    expect(tasksIn(TUESDAY)).toEqual(["Cook", "Shop", "Read", "Run"]);
    expect(screen.getByRole("checkbox", { name: "Done: Read" })).toBeChecked();
  });
});
