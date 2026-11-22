import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type Backend, type Category, type DayCount, type Task, type Theme, type User } from "./backend";

/**
 * The real backend. Not covered by automated tests (see the spec's Testing
 * Decisions); verify by hand against a dev Supabase project.
 */
export function createSupabaseBackend(url: string, publishableKey: string): Backend {
  const supabase = createClient(url, publishableKey);

  async function requireUserId(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Not signed in");
    return data.session.user.id;
  }

  return {
    async getCurrentUser() {
      const { data } = await supabase.auth.getSession();
      return data.session ? toUser(data.session.user) : null;
    },
    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onUserChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        listener(session ? toUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },

    async getSettings() {
      const { data, error } = await supabase.from("settings").select("day_count, theme").maybeSingle();
      if (error) throw error;
      if (!data) return { ...DEFAULT_SETTINGS };
      return { dayCount: data.day_count as DayCount, theme: data.theme as Theme | null };
    },
    async updateSettings(changes) {
      const userId = await requireUserId();
      const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
      if (changes.dayCount !== undefined) row.day_count = changes.dayCount;
      if (changes.theme !== undefined) row.theme = changes.theme;
      // Upsert: the row may not exist yet (starter data arrives in ticket 11).
      // Only the columns present in `row` are written on update.
      const { error } = await supabase.from("settings").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
    },

    async getCategories() {
      // position is collated "C" in the schema, so this matches byPosition.
      const { data, error } = await supabase.from("categories").select("id, name, position").order("position");
      if (error) throw error;
      return data as Category[];
    },
    async createCategory({ id, name, position }) {
      const userId = await requireUserId();
      const { error } = await supabase.from("categories").insert({ id, user_id: userId, name, position });
      if (error) throw error;
    },
    async renameCategory(id, name) {
      await updateCategory(id, { name });
    },
    async moveCategory(id, position) {
      await updateCategory(id, { position });
    },
    async deleteCategory(id) {
      // The tasks.category_id foreign key cascades, so its Tasks go too.
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },

    async getTasks() {
      const { data, error } = await supabase.from("tasks").select(TASK_COLUMNS);
      if (error) throw error;
      return (data as TaskRow[]).map(fromTaskRow);
    },
    async createTask(task) {
      const userId = await requireUserId();
      const { error } = await supabase.from("tasks").insert({ ...toTaskRow(task), user_id: userId });
      if (error) throw error;
    },
  };

  async function updateCategory(id: string, changes: { name?: string; position?: string }) {
    const { error } = await supabase
      .from("categories")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }
}

const TASK_COLUMNS = "id, title, notes, deadline, tags, done, done_at, day, category_id, position";

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  deadline: string | null;
  tags: string[];
  done: boolean;
  done_at: string | null;
  day: string | null;
  category_id: string | null;
  position: string;
};

function fromTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    deadline: row.deadline,
    tags: row.tags ?? [],
    done: row.done,
    doneAt: row.done_at,
    day: row.day,
    categoryId: row.category_id,
    position: row.position,
  };
}

function toTaskRow(task: Task): TaskRow {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    deadline: task.deadline,
    tags: task.tags,
    done: task.done,
    done_at: task.doneAt,
    day: task.day,
    category_id: task.categoryId,
    position: task.position,
  };
}

function toUser(user: SupabaseUser): User {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: meta.full_name ?? meta.name ?? user.email ?? "You",
    avatarUrl: meta.avatar_url ?? meta.picture,
  };
}

