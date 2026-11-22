import { generateNKeysBetween } from "fractional-indexing";
import { byPosition, DEFAULT_SETTINGS, type Backend, type Category, type Settings, type User } from "./backend";

type Options = {
  /** Start with this user already signed in. */
  signedInAs?: Omit<User, "id">;
  /** The account that "Sign in with Google" signs in as. */
  googleUser?: Omit<User, "id">;
  /** Settings already saved for the user. */
  settings?: Partial<Settings>;
  /** Categories already saved for the user, in order. */
  categories?: { name: string }[];
};

const DEFAULT_GOOGLE_USER: Omit<User, "id"> = { name: "Test User" };

export function createInMemoryBackend(options: Options = {}): Backend {
  let currentUser: User | null = options.signedInAs
    ? { id: "user-1", ...options.signedInAs }
    : null;
  let settings: Settings = { ...DEFAULT_SETTINGS, ...options.settings };
  const initialCategories = options.categories ?? [];
  const initialPositions = generateNKeysBetween(null, null, initialCategories.length);
  let categories: Category[] = initialCategories.map((category, i) => ({
    id: `category-${i + 1}`,
    name: category.name,
    position: initialPositions[i],
  }));
  const listeners = new Set<(user: User | null) => void>();

  function setUser(user: User | null) {
    currentUser = user;
    listeners.forEach((listener) => listener(user));
  }

  function requireUser() {
    if (!currentUser) throw new Error("Not signed in");
  }

  function requireCategory(id: string): Category {
    const category = categories.find((c) => c.id === id);
    if (!category) throw new Error(`No Category ${id}`);
    return category;
  }

  function replaceCategory(updated: Category) {
    categories = categories.map((c) => (c.id === updated.id ? updated : c));
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

    async getSettings() {
      requireUser();
      return { ...settings };
    },
    async updateSettings(changes) {
      requireUser();
      settings = { ...settings, ...changes };
    },

    async getCategories() {
      requireUser();
      return categories.map((c) => ({ ...c })).sort(byPosition);
    },
    async createCategory(category) {
      requireUser();
      if (!category.name.trim()) throw new Error("A Category needs a name");
      if (categories.some((c) => c.id === category.id)) throw new Error(`Category ${category.id} exists`);
      categories = [...categories, { ...category }];
    },
    async renameCategory(id, name) {
      requireUser();
      if (!name.trim()) throw new Error("A Category needs a name");
      replaceCategory({ ...requireCategory(id), name });
    },
    async moveCategory(id, position) {
      requireUser();
      replaceCategory({ ...requireCategory(id), position });
    },
    async deleteCategory(id) {
      requireUser();
      requireCategory(id);
      categories = categories.filter((c) => c.id !== id);
    },
  };
}
