import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderSignedIn, setToday } from "../test/renderApp";

beforeEach(() => {
  setToday(2026, 11, 23); // Monday 23 November 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the search box", () => {
  it("is hidden until / is pressed with nothing focused, and Escape hides it again", async () => {
    const { user } = await renderSignedIn();
    expect(screen.queryByRole("searchbox", { name: "Search" })).not.toBeInTheDocument();

    await user.keyboard("/");

    const search = screen.getByRole("searchbox", { name: "Search" });
    expect(search).toHaveFocus();
    expect(search).toHaveValue("");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("searchbox", { name: "Search" })).not.toBeInTheDocument();
  });

  it("opens with Ctrl+K", async () => {
    const { user } = await renderSignedIn();

    await user.keyboard("{Control>}k{/Control}");

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveFocus();
  });

  it("doesn't open when / is typed into a Task", async () => {
    const { user } = await renderSignedIn();

    await user.click(screen.getAllByRole("button", { name: "Add a task" })[0]);
    await user.keyboard("Read 1/2 of the book");

    expect(screen.getByRole("textbox", { name: "New task" })).toHaveValue("Read 1/2 of the book");
    expect(screen.queryByRole("searchbox", { name: "Search" })).not.toBeInTheDocument();
  });
});
