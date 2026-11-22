/**
 * The single seam between the app and wherever its data lives.
 * The app reaches sign-in state (and, in later tickets, Tasks, Categories and
 * Settings) only through this interface. There are two implementations: the
 * in-memory backend (tests, local dev) and the Supabase backend.
 */

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Backend = {
  /** The currently signed-in user, or null when signed out. */
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  /** Called whenever the signed-in user changes. Returns an unsubscribe function. */
  onUserChange(listener: (user: User | null) => void): () => void;
};
