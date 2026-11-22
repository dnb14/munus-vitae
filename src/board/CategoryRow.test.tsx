import { screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { reloadApp, renderSignedIn } from "../test/renderApp";

function categoryRow() {
  return screen.getByRole("region", { name: "Category row" });
}

function categoryNames() {
  return within(categoryRow())
    .queryAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

describe("Category row", () => {
  it("shows one column per Category, in my order, with + Add category at the end", async () => {
    await renderSignedIn({ categories: [{ name: "Groceries" }, { name: "School" }] });

    expect(await within(categoryRow()).findAllByRole("heading", { level: 2 })).toHaveLength(2);
    expect(categoryNames()).toEqual(["Groceries", "School"]);
    const columns = within(categoryRow()).getAllByRole("group");
    expect(columns.map((column) => column.getAttribute("aria-label"))).toEqual(["Groceries", "School"]);
    expect(within(categoryRow()).getByRole("button", { name: "+ Add category" })).toBeInTheDocument();
  });
});

describe("creating a Category", () => {
  it("adds a Category at the end, named in place, and saves it", async () => {
    const { user, backend, unmount } = await renderSignedIn({ categories: [{ name: "Groceries" }] });

    await user.click(await screen.findByRole("button", { name: "+ Add category" }));
    await user.keyboard("Reading{Enter}");

    expect(categoryNames()).toEqual(["Groceries", "Reading"]);
    expect(screen.queryByRole("textbox", { name: "New category name" })).not.toBeInTheDocument();
    await vi.waitFor(async () =>
      expect((await backend.getCategories()).map((c) => c.name)).toEqual(["Groceries", "Reading"]),
    );

    unmount();
    await reloadApp(backend);
    expect(categoryNames()).toEqual(["Groceries", "Reading"]);
  });

  it("rejects an empty name", async () => {
    const { user, backend } = await renderSignedIn();

    await user.click(await screen.findByRole("button", { name: "+ Add category" }));
    await user.keyboard("   {Enter}");

    expect(screen.getByRole("textbox", { name: "New category name" })).toBeInTheDocument();
    expect(categoryNames()).toEqual([]);
    expect(await backend.getCategories()).toEqual([]);
  });

  it("cancels with Escape", async () => {
    const { user, backend } = await renderSignedIn();

    await user.click(await screen.findByRole("button", { name: "+ Add category" }));
    await user.keyboard("Reading{Escape}");

    expect(screen.queryByRole("textbox", { name: "New category name" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add category" })).toBeInTheDocument();
    expect(categoryNames()).toEqual([]);
    expect(await backend.getCategories()).toEqual([]);
  });
});

describe("renaming a Category", () => {
  it("edits the name in place; Enter saves", async () => {
    const { user, backend } = await renderSignedIn({ categories: [{ name: "Groceries" }, { name: "School" }] });

    await user.click(await screen.findByRole("button", { name: "School" }));
    const input = screen.getByRole("textbox", { name: "Category name" });
    expect(input).toHaveValue("School");
    await user.clear(input);
    await user.keyboard("University{Enter}");

    expect(categoryNames()).toEqual(["Groceries", "University"]);
    await vi.waitFor(async () =>
      expect((await backend.getCategories()).map((c) => c.name)).toEqual(["Groceries", "University"]),
    );
  });

  it("Escape cancels", async () => {
    const { user, backend } = await renderSignedIn({ categories: [{ name: "School" }] });

    await user.click(await screen.findByRole("button", { name: "School" }));
    await user.keyboard("{End} stuff{Escape}");

    expect(screen.queryByRole("textbox", { name: "Category name" })).not.toBeInTheDocument();
    expect(categoryNames()).toEqual(["School"]);
    expect((await backend.getCategories()).map((c) => c.name)).toEqual(["School"]);
  });

  it("rejects an empty name", async () => {
    const { user, backend } = await renderSignedIn({ categories: [{ name: "School" }] });

    await user.click(await screen.findByRole("button", { name: "School" }));
    await user.clear(screen.getByRole("textbox", { name: "Category name" }));
    await user.keyboard("{Enter}");

    expect(screen.getByRole("textbox", { name: "Category name" })).toBeInTheDocument();
    expect((await backend.getCategories()).map((c) => c.name)).toEqual(["School"]);
  });
});

describe("deleting a Category", () => {
  it("deletes an empty Category straight away from the ⋯ menu", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }],
    });

    const school = await screen.findByRole("group", { name: "School" });
    await user.click(within(school).getByRole("button", { name: "More actions for School" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(categoryNames()).toEqual(["Groceries"]);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await vi.waitFor(async () =>
      expect((await backend.getCategories()).map((c) => c.name)).toEqual(["Groceries"]),
    );

    unmount();
    await reloadApp(backend);
    expect(categoryNames()).toEqual(["Groceries"]);
  });

  it("closes the ⋯ menu with Escape without deleting", async () => {
    const { user, backend } = await renderSignedIn({ categories: [{ name: "School" }] });

    await user.click(await screen.findByRole("button", { name: "More actions for School" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(categoryNames()).toEqual(["School"]);
    expect(await backend.getCategories()).toHaveLength(1);
  });
});

describe("reordering Categories", () => {
  it("moves a Category by keyboard drag, rewriting only its ordering key, and keeps the order", async () => {
    const { user, backend, unmount } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }, { name: "Reading" }],
    });
    const before = await backend.getCategories();

    (await screen.findByRole("button", { name: "Move Reading" })).focus();
    await user.keyboard("[Space]");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    await user.keyboard("[Space]");

    await vi.waitFor(() => expect(categoryNames()).toEqual(["Reading", "Groceries", "School"]));
    await vi.waitFor(async () =>
      expect((await backend.getCategories()).map((c) => c.name)).toEqual(["Reading", "Groceries", "School"]),
    );
    const after = await backend.getCategories();
    const positionOf = (categories: typeof before, name: string) =>
      categories.find((c) => c.name === name)!.position;
    expect(positionOf(after, "Groceries")).toBe(positionOf(before, "Groceries"));
    expect(positionOf(after, "School")).toBe(positionOf(before, "School"));
    expect(positionOf(after, "Reading")).not.toBe(positionOf(before, "Reading"));

    unmount();
    await reloadApp(backend);
    expect(categoryNames()).toEqual(["Reading", "Groceries", "School"]);
  });

  it("moves a Category right, into the middle", async () => {
    const { user, backend } = await renderSignedIn({
      categories: [{ name: "Groceries" }, { name: "School" }, { name: "Reading" }],
    });

    (await screen.findByRole("button", { name: "Move Groceries" })).focus();
    await user.keyboard("[Space]");
    await user.keyboard("{ArrowRight}");
    await user.keyboard("[Space]");

    await vi.waitFor(() => expect(categoryNames()).toEqual(["School", "Groceries", "Reading"]));
    await vi.waitFor(async () =>
      expect((await backend.getCategories()).map((c) => c.name)).toEqual(["School", "Groceries", "Reading"]),
    );
  });

  it("leaves the order alone when a keyboard drag is cancelled", async () => {
    const { user, backend } = await renderSignedIn({ categories: [{ name: "Groceries" }, { name: "School" }] });

    (await screen.findByRole("button", { name: "Move School" })).focus();
    await user.keyboard("[Space]");
    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{Escape}");

    expect(categoryNames()).toEqual(["Groceries", "School"]);
    expect((await backend.getCategories()).map((c) => c.name)).toEqual(["Groceries", "School"]);
  });
});
