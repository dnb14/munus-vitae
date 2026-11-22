import { screen } from "@testing-library/react";
import { createInMemoryBackend } from "./backend/inMemoryBackend";
import { renderApp } from "./test/renderApp";

describe("signing in and out", () => {
  it("shows the sign-in screen when signed out", async () => {
    renderApp();

    expect(
      await screen.findByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Day row" })).not.toBeInTheDocument();
  });

  it("shows the page after signing in, and the sign-in screen after signing out", async () => {
    const { user } = renderApp(createInMemoryBackend({ googleUser: { name: "Ada Lovelace" } }));

    await user.click(await screen.findByRole("button", { name: "Sign in with Google" }));

    expect(await screen.findByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Day row" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Category row" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      await screen.findByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Day row" })).not.toBeInTheDocument();
  });

  it("opens straight to the page when a session already exists", async () => {
    renderApp(createInMemoryBackend({ signedInAs: { name: "Ada Lovelace" } }));

    expect(await screen.findByRole("region", { name: "Day row" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
  });
});
