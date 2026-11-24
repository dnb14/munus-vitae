import { screen } from "@testing-library/react";
import { createInMemoryBackend } from "./backend/inMemoryBackend";
import { goTo, renderApp } from "./test/renderApp";

describe("signing in and out", () => {
  it("shows the sign-in screen when signed out", async () => {
    renderApp();

    expect(
      await screen.findByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Day row" })).not.toBeInTheDocument();
  });

  it("shows the page after signing in, with no account controls on it", async () => {
    const { user } = renderApp(createInMemoryBackend({ googleUser: { name: "Ada Lovelace" } }));

    await user.click(await screen.findByRole("button", { name: "Sign in with Google" }));

    expect(await screen.findByRole("region", { name: "Day row" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Category row" })).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("opens straight to the page when a session already exists", async () => {
    renderApp(createInMemoryBackend({ signedInAs: { name: "Ada Lovelace" } }));

    expect(await screen.findByRole("region", { name: "Day row" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
  });
});

describe("the account page at /account", () => {
  it("shows who is signed in, signs out, and then offers signing in", async () => {
    goTo("/account");
    const { user, backend } = renderApp(createInMemoryBackend({ signedInAs: { name: "Ada Lovelace" } }));

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Day row" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the board" })).toHaveAttribute("href", "/");

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
    expect(await backend.getCurrentUser()).toBeNull();
  });

  it("signs in from the account page", async () => {
    goTo("/account");
    const { user } = renderApp(createInMemoryBackend({ googleUser: { name: "Ada Lovelace" } }));

    await user.click(await screen.findByRole("button", { name: "Sign in with Google" }));

    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
