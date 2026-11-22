import { generateNKeysBetween } from "fractional-indexing";
import {
  byPosition,
  DEFAULT_SETTINGS,
  type Backend,
  type Category,
  type DataChange,
  type Settings,
  type Task,
  type User,
} from "./backend";
import { rolloverPlan } from "../board/boardModel";

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
  tasks?: ({ title: string; doneAt?: string } & Partial<Pick<Task, "notes" | "deadline" | "tags">> &
    ({ day: string } | { category: string }))[];
};

const DEFAULT_GOOGLE_USER: Omit<User, "id"> = { name: "Test User" };

export type InMemoryBackend = Backend & {
  /** Makes the next command that saves something fail, as when the server rejects it. */
  rejectNextSave(): void;
};

export function createInMemoryBackend(options: Options = {}): InMemoryBackend {
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
    notes: task.notes ?? null,
    deadline: task.deadline ?? null,
    tags: [...(task.tags ?? [])],
    done: task.doneAt !== undefined,
    doneAt: task.doneAt ?? null,
    day: "day" in task ? task.day : null,
    categoryId: "category" in task ? categoryIdNamed(task.category) : null,
    position: taskPositions[i],
  }));
  const listeners = new Set<(user: User | null) => void>();
  const changeListeners = new Set<(change: DataChange) => void>();

  /** Tells every subscriber, this screen included, as Supabase Realtime does. */
  function emit(change: DataChange) {
    changeListeners.forEach((listener) => listener(change));
  }

  function categoryIdNamed(name: string): string {
    const category = categories.find((c) => c.name === name);
    if (!category) throw new Error(`No Category named ${name}`);
    return category.id;
  }

  function setUser(user: User | null) {
    currentUser = user;
    listeners.forEach((listener) => listener(user));
  }

  let rejectingNextSave = false;

  function requireUser() {
    if (!currentUser) throw new Error("Not signed in");
  }

  /** Every command that saves something starts here. */
  function beginSave() {
    requireUser();
    if (rejectingNextSave) {
      rejectingNextSave = false;
      throw new Error("The save was rejected");
    }
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
    emitTaskSaved(updated);
  }

  function emitTaskSaved(task: Task) {
    emit({ kind: "taskSaved", task: { ...task, tags: [...task.tags] } });
  }

  function replaceCategory(updated: Category) {
    categories = categories.map((c) => (c.id === updated.id ? updated : c));
    emit({ kind: "categorySaved", category: { ...updated } });
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
      beginSave();
      settings = { ...settings, ...changes };
      emit({ kind: "settingsSaved", settings: { ...settings } });
    },

    async getCategories() {
      requireUser();
      return categories.map((c) => ({ ...c })).sort(byPosition);
    },
    async createCategory(category) {
      beginSave();
      if (!category.name.trim()) throw new Error("A Category needs a name");
      if (categories.some((c) => c.id === category.id)) throw new Error(`Category ${category.id} exists`);
      categories = [...categories, { ...category }];
      emit({ kind: "categorySaved", category: { ...category } });
    },
    async renameCategory(id, name) {
      beginSave();
      if (!name.trim()) throw new Error("A Category needs a name");
      replaceCategory({ ...requireCategory(id), name });
    },
    async moveCategory(id, position) {
      beginSave();
      replaceCategory({ ...requireCategory(id), position });
    },
    async deleteCategory(id) {
      beginSave();
      requireCategory(id);
      categories = categories.filter((c) => c.id !== id);
      tasks = tasks.filter((t) => t.categoryId !== id);
      // Like a cascading delete, its Tasks go without a change of their own.
      emit({ kind: "categoryDeleted", id });
    },

    async getTasks() {
      requireUser();
      return tasks.map((t) => ({ ...t, tags: [...t.tags] }));
    },
    async createTask(task) {
      beginSave();
      if (!task.title.trim()) throw new Error("A Task needs a title");
      if ((task.day === null) === (task.categoryId === null)) {
        throw new Error("A Task must be in exactly one of a day or a Category");
      }
      if (task.categoryId !== null) requireCategory(task.categoryId);
      if (tasks.some((t) => t.id === task.id)) throw new Error(`Task ${task.id} exists`);
      tasks = [...tasks, { ...task, tags: [...task.tags] }];
      emitTaskSaved(task);
    },
    async markTaskDone(id, doneAt) {
      beginSave();
      replaceTask({ ...requireTask(id), done: true, doneAt });
    },
    async markTaskNotDone(id, position) {
      beginSave();
      replaceTask({ ...requireTask(id), done: false, doneAt: null, position });
    },
    async updateTask(id, changes) {
      beginSave();
      if (changes.title !== undefined && !changes.title.trim()) throw new Error("A Task needs a title");
      const task = requireTask(id);
      const { title, notes, deadline, tags } = { ...task, ...changes };
      replaceTask({ ...task, title, notes, deadline, tags: [...tags] });
    },
    async deleteTask(id) {
      beginSave();
      requireTask(id);
      tasks = tasks.filter((t) => t.id !== id);
      emit({ kind: "taskDeleted", id });
    },
    async moveTask(id, { day, categoryId }, position) {
      beginSave();
      if ((day === null) === (categoryId === null)) {
        throw new Error("A Task must be in exactly one of a day or a Category");
      }
      if (categoryId !== null) requireCategory(categoryId);
      replaceTask({ ...requireTask(id), day, categoryId, position });
    },
    async rollOverTo(day) {
      beginSave();
      for (const { id, position } of rolloverPlan(tasks, day)) {
        replaceTask({ ...requireTask(id), day, position });
      }
    },
    async clearDoneTasks(categoryId) {
      beginSave();
      requireCategory(categoryId);
      const cleared = tasks.filter((t) => t.categoryId === categoryId && t.done);
      tasks = tasks.filter((t) => !cleared.includes(t));
      cleared.forEach((t) => emit({ kind: "taskDeleted", id: t.id }));
    },

    rejectNextSave() {
      rejectingNextSave = true;
    },

    subscribeToChanges(listener) {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
  };
}
