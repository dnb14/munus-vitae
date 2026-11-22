import type { Backend, User } from "./backend";

type Options = {
  /** Start with this user already signed in. */
  signedInAs?: Omit<User, "id">;
  /** The account that "Sign in with Google" signs in as. */
  googleUser?: Omit<User, "id">;
};

const DEFAULT_GOOGLE_USER: Omit<User, "id"> = { name: "Test User" };

export function createInMemoryBackend(options: Options = {}): Backend {
  let currentUser: User | null = options.signedInAs
    ? { id: "user-1", ...options.signedInAs }
    : null;
  const listeners = new Set<(user: User | null) => void>();

  function setUser(user: User | null) {
    currentUser = user;
    listeners.forEach((listener) => listener(user));
  }

  return {
    async getCurrentUser() {
      return currentUser;
    },
    async signInWithGoogle() {
      setUser({ id: "user-1", ...(options.googleUser ?? DEFAULT_GOOGLE_USER) });
    },
    async signOut() {
      setUser(null);
    },
    onUserChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
