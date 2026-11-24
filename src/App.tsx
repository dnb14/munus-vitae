import { useEffect, useState } from "react";
import type { Backend, User } from "./backend/backend";
import { BackendProvider } from "./backend/BackendContext";
import { Board } from "./board/Board";
import { Account } from "./auth/Account";
import { SignIn } from "./auth/SignIn";

type SessionState = { status: "loading" } | { status: "ready"; user: User | null };

export function App({ backend }: { backend: Backend }) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const unsubscribe = backend.onUserChange((user) => {
      if (active) setSession({ status: "ready", user });
    });
    backend.getCurrentUser().then((user) => {
      if (active) setSession({ status: "ready", user });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [backend]);

  if (session.status === "loading") return null;

  return (
    <BackendProvider backend={backend}>
      {isAccountPage() ? (
        <Account user={session.user} />
      ) : session.user ? (
        <Board />
      ) : (
        <SignIn />
      )}
    </BackendProvider>
  );
}

/** Signing in and out lives at its own address, /account, typed into the address bar. */
function isAccountPage(): boolean {
  return window.location.pathname.replace(/\/+$/, "") === "/account";
}
