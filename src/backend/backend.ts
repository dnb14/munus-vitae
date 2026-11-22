/**
 * The single seam between the app and wherever its data lives.
 * The app reaches sign-in state, Settings (and, in later tickets, Tasks and
 * Categories) only through this interface. There are two implementations: the
 * in-memory backend (tests, local dev) and the Supabase backend.
 */

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type DayCount = 5 | 6 | 7;
export type Theme = "light" | "dark";

export type Settings = {
  /** How many Day columns the Day row shows. */
  dayCount: DayCount;
  /** null until the user first presses the theme toggle: follow the system. */
  theme: Theme | null;
};

export const DEFAULT_SETTINGS: Settings = { dayCount: 7, theme: null };

export type Category = {
  id: string;
  name: string;
  /** Fractional-indexing ordering key; Categories sort by plain string comparison of it. */
  position: string;
};

export type Backend = {
  /** The currently signed-in user, or null when signed out. */
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  /** Called whenever the signed-in user changes. Returns an unsubscribe function. */
  onUserChange(listener: (user: User | null) => void): () => void;

  /** The signed-in user's Settings, or the defaults if none are saved yet. */
  getSettings(): Promise<Settings>;
  /** Saves the given Settings fields, leaving the others as they are. */
  updateSettings(changes: Partial<Settings>): Promise<void>;

  /** The signed-in user's Categories, sorted by position. */
  getCategories(): Promise<Category[]>;
  /** Creates a Category. The caller picks the id and position, so the screen can show it straight away. */
  createCategory(category: Category): Promise<void>;
  renameCategory(id: string, name: string): Promise<void>;
  /** Moves a Category by giving it a new position. No other Category changes. */
  moveCategory(id: string, position: string): Promise<void>;
  /** Deletes a Category (and, once Tasks exist, its Tasks). */
  deleteCategory(id: string): Promise<void>;
};

/** Sorts by ordering key. Keys compare by code unit, never by locale. */
export function byPosition<T extends { position: string }>(a: T, b: T): number {
  return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
}
