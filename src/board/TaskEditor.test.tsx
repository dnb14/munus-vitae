import { screen, within } from "@testing-library/react";
import { vi } from "vitest";
import type { Backend, Task } from "../backend/backend";
import { reloadApp, renderSignedIn, setToday } from "../test/renderApp";

const MONDAY = "Monday, 23 November 2026";

function column(name: string) {
  return screen.getByRole("group", { name });
}

/** The titles of the Tasks in a column, in order. */
function titlesIn(name: string) {
  return within(column(name))
    .queryAllByRole("listitem")
    .map((item) => within(item).getByRole("button", { name: /^Edit / }).textContent);
}

function taskLine(title: string) {
  return screen.getByRole("button", { name: `Edit ${title}` }).closest("li")!;
}

function editor() {
  return screen.getByRole("dialog", { name: "Edit task" });
}

async function savedTask(backend: Backend, title: string): Promise<Task | undefined> {
  return (await backend.getTasks()).find((t) => t.title === title);
}

beforeEach(() => {
  setToday(2026, 11, 23); // Monday 23 November 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("opening the editor", () => {
  it("opens when the Task's text is clicked, not when its checkbox is", async () => {
    const { user } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });

    await user.click(screen.getByRole("checkbox", { name: "Done: Call mum" }));
    expect(screen.queryByRole("dialog", { name: "Edit task" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    expect(within(editor()).getByRole("textbox", { name: "Title" })).toHaveValue("Call mum");
  });

  it("closes with the Close button or Escape", async () => {
    const { user } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    await user.click(within(editor()).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("editing the title", () => {
  it("saves a new title, which survives a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    const title = within(editor()).getByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Call mum back");
    await user.keyboard("{Escape}");

    expect(titlesIn(MONDAY)).toEqual(["Call mum back"]);
    await vi.waitFor(async () => expect(await savedTask(backend, "Call mum back")).toBeDefined());

    unmount();
    await reloadApp(backend);
    expect(titlesIn(MONDAY)).toEqual(["Call mum back"]);
  });

  it("rejects an empty title and keeps the old one", async () => {
    const { user, backend } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    await user.clear(within(editor()).getByRole("textbox", { name: "Title" }));
    await user.click(within(editor()).getByRole("button", { name: "Close" }));

    expect(titlesIn(MONDAY)).toEqual(["Call mum"]);
    expect(await savedTask(backend, "Call mum")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    expect(within(editor()).getByRole("textbox", { name: "Title" })).toHaveValue("Call mum");
  });
});

describe("Notes", () => {
  it("saves Notes, which survive a reload, and clearing them saves no Notes", async () => {
    const { user, backend, unmount } = await renderSignedIn({ tasks: [{ title: "Call mum", day: "2026-11-23" }] });

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    await user.type(within(editor()).getByRole("textbox", { name: "Notes" }), "Ask about Sunday");
    await user.click(within(editor()).getByRole("button", { name: "Close" }));
    await vi.waitFor(async () => expect((await savedTask(backend, "Call mum"))?.notes).toBe("Ask about Sunday"));

    unmount();
    const { user: user2 } = await reloadApp(backend);
    await user2.click(screen.getByRole("button", { name: "Edit Call mum" }));
    const notes = within(editor()).getByRole("textbox", { name: "Notes" });
    expect(notes).toHaveValue("Ask about Sunday");

    await user2.clear(notes);
    await user2.keyboard("{Escape}");
    await vi.waitFor(async () => expect((await savedTask(backend, "Call mum"))?.notes).toBeNull());
  });
});

describe("Delete", () => {
  it("removes the Task", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Buy stamps", day: "2026-11-23" },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    await user.click(within(editor()).getByRole("button", { name: "Delete" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(titlesIn(MONDAY)).toEqual(["Buy stamps"]);
    await vi.waitFor(async () => expect((await backend.getTasks()).map((t) => t.title)).toEqual(["Buy stamps"]));

    unmount();
    await reloadApp(backend);
    expect(titlesIn(MONDAY)).toEqual(["Buy stamps"]);
  });
});

describe("Deadlines", () => {
  it("sets a Deadline, shown as a badge, without moving the Task, and it survives a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      categories: [{ name: "School" }],
      tasks: [
        { title: "Call mum", day: "2026-11-23" },
        { title: "Finish problem set", category: "School" },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Edit Finish problem set" }));
    await user.type(within(editor()).getByLabelText("Deadline"), "2026-11-26");
    await user.click(within(editor()).getByRole("button", { name: "Close" }));

    expect(within(taskLine("Finish problem set")).getByTitle("Deadline: 26 Nov")).toHaveTextContent("26 Nov");
    expect(titlesIn("School")).toEqual(["Finish problem set"]);
    expect(titlesIn("Thursday, 26 November 2026")).toEqual([]);
    await vi.waitFor(async () => {
      const task = await savedTask(backend, "Finish problem set");
      expect(task?.deadline).toBe("2026-11-26");
      expect(task?.categoryId).not.toBeNull();
      expect(task?.day).toBeNull();
    });

    unmount();
    await reloadApp(backend);
    expect(within(taskLine("Finish problem set")).getByTitle("Deadline: 26 Nov")).toBeInTheDocument();
    expect(titlesIn("School")).toEqual(["Finish problem set"]);
  });

  it("clears a Deadline", async () => {
    const { user, backend } = await renderSignedIn({
      tasks: [{ title: "Call mum", day: "2026-11-23", deadline: "2026-11-25" }],
    });
    expect(within(taskLine("Call mum")).getByText("25 Nov")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Call mum" }));
    expect(within(editor()).getByLabelText("Deadline")).toHaveValue("2026-11-25");
    await user.click(within(editor()).getByRole("button", { name: "Clear deadline" }));
    await user.click(within(editor()).getByRole("button", { name: "Close" }));

    expect(within(taskLine("Call mum")).queryByText("25 Nov")).not.toBeInTheDocument();
    await vi.waitFor(async () => expect((await savedTask(backend, "Call mum"))?.deadline).toBeNull());
    expect((await savedTask(backend, "Call mum"))?.day).toBe("2026-11-23");
  });

  it("turns the badge red once the Deadline has passed, unless the Task is Done", async () => {
    // In a Category, so they stay on screen as Today moves on.
    const { backend, unmount } = await renderSignedIn({
      categories: [{ name: "School" }],
      tasks: [
        { title: "Finish problem set", category: "School", deadline: "2026-11-24" },
        { title: "Return books", category: "School", deadline: "2026-11-24", doneAt: "2026-11-23T09:00:00.000Z" },
      ],
    });
    expect(within(taskLine("Finish problem set")).getByTitle("Deadline: 24 Nov")).toBeInTheDocument();

    // On the Deadline itself, it isn't overdue yet.
    unmount();
    vi.setSystemTime(new Date(2026, 10, 24, 10));
    const second = await reloadApp(backend);
    expect(within(taskLine("Finish problem set")).getByTitle("Deadline: 24 Nov")).toBeInTheDocument();

    // The day after, it is: red, while the Done Task's badge isn't.
    second.unmount();
    vi.setSystemTime(new Date(2026, 10, 25, 10));
    await reloadApp(backend);
    const badge = within(taskLine("Finish problem set")).getByTitle("Overdue: 24 Nov");
    expect(badge).toHaveClass("deadline-badge--overdue");
    const doneBadge = within(taskLine("Return books")).getByTitle("Deadline: 24 Nov");
    expect(doneBadge).not.toHaveClass("deadline-badge--overdue");
  });
});

describe("Tags", () => {
  it("adds Tags by typing, ignores duplicates, removes them one at a time, and they survive a reload", async () => {
    const { user, backend, unmount } = await renderSignedIn({ tasks: [{ title: "Finish problem set", day: "2026-11-23" }] });

    await user.click(screen.getByRole("button", { name: "Edit Finish problem set" }));
    const addTag = within(editor()).getByRole("textbox", { name: "Add tag" });
    await user.type(addTag, "homework{Enter}maths{Enter} homework {Enter}urgent{Enter}");
    await user.click(within(editor()).getByRole("button", { name: "Remove tag maths" }));
    await user.click(within(editor()).getByRole("button", { name: "Close" }));

    const chips = within(taskLine("Finish problem set")).getAllByRole("button", { name: /^Filter by tag/ });
    expect(chips.map((chip) => chip.textContent)).toEqual(["homework", "urgent"]);
    await vi.waitFor(async () =>
      expect((await savedTask(backend, "Finish problem set"))?.tags).toEqual(["homework", "urgent"]),
    );

    unmount();
    const { user: user2 } = await reloadApp(backend);
    await user2.click(screen.getByRole("button", { name: "Edit Finish problem set" }));
    expect(within(editor()).getByRole("button", { name: "Remove tag homework" })).toBeInTheDocument();
    expect(within(editor()).getByRole("button", { name: "Remove tag urgent" })).toBeInTheDocument();
  });
});

describe("filtering by Tag", () => {
  it("dims every Task without the Tag in both rows, shows the Tag in the bottom bar, and ✕ clears it", async () => {
    const { user } = await renderSignedIn({
      categories: [{ name: "School" }],
      tasks: [
        { title: "Revise for test", day: "2026-11-23", tags: ["homework"] },
        { title: "Call mum", day: "2026-11-24" },
        { title: "Finish problem set", category: "School", tags: ["maths", "homework"] },
        { title: "Read chapter 3", category: "School", tags: ["reading"] },
      ],
    });
    const bottomBar = screen.getByRole("contentinfo");
    expect(within(bottomBar).queryByRole("group", { name: "Tag filter" })).not.toBeInTheDocument();

    await user.click(within(taskLine("Finish problem set")).getByRole("button", { name: "Filter by tag homework" }));

    expect(within(within(bottomBar).getByRole("group", { name: "Tag filter" })).getByText("#homework")).toBeInTheDocument();
    expect(taskLine("Revise for test")).not.toHaveClass("task-line--dimmed");
    expect(taskLine("Finish problem set")).not.toHaveClass("task-line--dimmed");
    expect(taskLine("Call mum")).toHaveClass("task-line--dimmed");
    expect(taskLine("Read chapter 3")).toHaveClass("task-line--dimmed");

    await user.click(within(bottomBar).getByRole("button", { name: "Clear tag filter" }));

    expect(within(bottomBar).queryByRole("group", { name: "Tag filter" })).not.toBeInTheDocument();
    for (const title of ["Revise for test", "Call mum", "Finish problem set", "Read chapter 3"]) {
      expect(taskLine(title)).not.toHaveClass("task-line--dimmed");
    }
  });

  it("switches to another Tag when its chip is clicked", async () => {
    const { user } = await renderSignedIn({
      categories: [{ name: "School" }],
      tasks: [
        { title: "Finish problem set", category: "School", tags: ["maths", "homework"] },
        { title: "Read chapter 3", category: "School", tags: ["reading"] },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Filter by tag maths" }));
    await user.click(screen.getByRole("button", { name: "Filter by tag reading" }));

    expect(within(screen.getByRole("group", { name: "Tag filter" })).getByText("#reading")).toBeInTheDocument();
    expect(taskLine("Read chapter 3")).not.toHaveClass("task-line--dimmed");
    expect(taskLine("Finish problem set")).toHaveClass("task-line--dimmed");
  });
});
