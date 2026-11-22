import { generateNKeysBetween } from "fractional-indexing";
import { byPosition, DEFAULT_SETTINGS, type Backend, type Category, type Settings, type Task, type User } from "./backend";

type Options = {
  /** Start with this user already signed in. */
  signedInAs?: Omit<User, "id">;
  /** The account that "Sign in with Google" signs in as. */
  googleUser?: Omit<User, "id">;
  /** Settings already saved for the user. */
  settings?: Partial<Settings>;
  /** Categories already saved for the user, in order. */
  categories?: { name: string }[];
  /**
   * Tasks already saved for the user, in order within each place. Each names
   * either a `day` ("YYYY-MM-DD") or a `category` (by its name, from `categories`).
   * A Task with `doneAt` (an ISO timestamp) is Done.
   */
  tasks?: ({ title: string; doneAt?: string } & ({ day: string } | { category: string }))[];
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
  const initialTasks = options.tasks ?? [];
  const taskPositions = generateNKeysBetween(null, null, initialTasks.length);
  let tasks: Task[] = initialTasks.map((task, i) => ({
    id: `task-${i + 1}`,
    title: task.title,
    notes: null,
    deadline: null,
    tags: [],
    done: task.doneAt !== undefined,
    doneAt: task.doneAt ?? null,
    day: "day" in task ? task.day : null,
    categoryId: "category" in task ? categoryIdNamed(task.category) : null,
    position: taskPositions[i],
  }));
  const listeners = new Set<(user: User | null) => void>();

  function categoryIdNamed(name: string): string {
    const category = categories.find((c) => c.name === name);
    if (!category) throw new Error(`No Category named ${name}`);
    return category.id;
  }

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

  function requireTask(id: string): Task {
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error(`No Task ${id}`);
    return task;
  }

  function replaceTask(updated: Task) {
    tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
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
      tasks = tasks.filter((t) => t.categoryId !== id);
    },

    async getTasks() {
      requireUser();
      return tasks.map((t) => ({ ...t, tags: [...t.tags] }));
    },
    async createTask(task) {
      requireUser();
      if (!task.title.trim()) throw new Error("A Task needs a title");
      if ((task.day === null) === (task.categoryId === null)) {
        throw new Error("A Task must be in exactly one of a day or a Category");
      }
      if (task.categoryId !== null) requireCategory(task.categoryId);
      if (tasks.some((t) => t.id === task.id)) throw new Error(`Task ${task.id} exists`);
      tasks = [...tasks, { ...task, tags: [...task.tags] }];
    },
    async markTaskDone(id, doneAt) {
      requireUser();
      replaceTask({ ...requireTask(id), done: true, doneAt });
    },
    async markTaskNotDone(id, position) {
      requireUser();
      replaceTask({ ...requireTask(id), done: false, doneAt: null, position });
    },
    async clearDoneTasks(categoryId) {
      requireUser();
      requireCategory(categoryId);
      tasks = tasks.filter((t) => !(t.categoryId === categoryId && t.done));
    },
  };
}
