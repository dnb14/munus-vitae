/**
 * The single seam between the app and wherever its data lives.
 * The app reaches sign-in state, Settings, Categories and Tasks only through
 * this interface. There are two implementations: the
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

/**
 * A single to-do item. It lives in exactly one place: a day (`day` set) or a
 * Category (`categoryId` set), never both and never neither.
 */
export type Task = {
  id: string;
  title: string;
  notes: string | null;
  /** "YYYY-MM-DD", or null when there is no Deadline. */
  deadline: string | null;
  tags: string[];
  done: boolean;
  /** ISO timestamp of when the Task was marked Done; null while unfinished. */
  doneAt: string | null;
  /** "YYYY-MM-DD" of the Day column it is in, or null when it is in a Category. */
  day: string | null;
  categoryId: string | null;
  /** Fractional-indexing ordering key within its place. */
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
  /** Deletes a Category and every Task in it. */
  deleteCategory(id: string): Promise<void>;

  /** All of the signed-in user's Tasks, in no particular order. */
  getTasks(): Promise<Task[]>;
  /** Creates a Task. The caller picks the id and position, so the screen can show it straight away. */
  createTask(task: Task): Promise<void>;
  /** Marks a Task Done at the given ISO timestamp. The caller picks it, so the screen can order Done Tasks straight away. */
  markTaskDone(id: string, doneAt: string): Promise<void>;
  /** Marks a Done Task unfinished again, clearing its doneAt and giving it a new position. */
  markTaskNotDone(id: string, position: string): Promise<void>;
  /** Deletes the Done Tasks in a Category. Its unfinished Tasks stay. */
  clearDoneTasks(categoryId: string): Promise<void>;
};

/** Sorts by ordering key. Keys compare by code unit, never by locale. */
export function byPosition<T extends { position: string }>(a: T, b: T): number {
  return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
}
