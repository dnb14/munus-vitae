import { createClient, type RealtimeChannel, type User as SupabaseUser } from "@supabase/supabase-js";
import {
  DEFAULT_SETTINGS,
  type Backend,
  type Category,
  type DataChange,
  type DayCount,
  type Settings,
  type Task,
  type Theme,
  type User,
} from "./backend";
import { rolloverPlan } from "../board/boardModel";

/**
 * The real backend. Not covered by automated tests (see the spec's Testing
 * Decisions); verify by hand against a dev Supabase project.
 */
export function createSupabaseBackend(url: string, publishableKey: string): Backend {
  const supabase = createClient(url, publishableKey);

  // One Realtime channel per tab, shared by every subscriber while any remain.
  const changeListeners = new Set<(change: DataChange) => void>();
  let channel: RealtimeChannel | null = null;

  function emit(change: DataChange) {
    changeListeners.forEach((listener) => listener(change));
  }

  // Realtime sends only the rows row-level security lets this user read.
  // A delete carries just the id: Realtime can't check who owned a deleted
  // row, so ids of other users' rows may arrive, and match nothing here.
  function openChangesChannel(): RealtimeChannel {
    return supabase
      .channel("data-changes")
      .on<TaskRow>("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        if (payload.eventType === "DELETE") {
          if (payload.old.id) emit({ kind: "taskDeleted", id: payload.old.id });
        } else {
          emit({ kind: "taskSaved", task: fromTaskRow(payload.new) });
        }
      })
      .on<Category>("postgres_changes", { event: "*", schema: "public", table: "categories" }, (payload) => {
        if (payload.eventType === "DELETE") {
          if (payload.old.id) emit({ kind: "categoryDeleted", id: payload.old.id });
        } else {
          const { id, name, position } = payload.new;
          emit({ kind: "categorySaved", category: { id, name, position } });
        }
      })
      .on<SettingsRow>("postgres_changes", { event: "*", schema: "public", table: "settings" }, (payload) => {
        if (payload.eventType !== "DELETE") emit({ kind: "settingsSaved", settings: fromSettingsRow(payload.new) });
      })
      .subscribe();
  }

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
      return fromSettingsRow(data as SettingsRow);
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
      requireRow(await supabase.from("categories").delete().eq("id", id).select("id"));
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
    async markTaskDone(id, doneAt) {
      await updateTask(id, { done: true, done_at: doneAt });
    },
    async markTaskNotDone(id, position) {
      await updateTask(id, { done: false, done_at: null, position });
    },
    async updateTask(id, changes) {
      // Only the details given are written; day, category and position are never touched.
      const row: Partial<TaskRow> = {};
      if (changes.title !== undefined) row.title = changes.title;
      if (changes.notes !== undefined) row.notes = changes.notes;
      if (changes.deadline !== undefined) row.deadline = changes.deadline;
      if (changes.tags !== undefined) row.tags = changes.tags;
      await updateTask(id, row);
    },
    async deleteTask(id) {
      requireRow(await supabase.from("tasks").delete().eq("id", id).select("id"));
    },
    async moveTask(id, { day, categoryId }, position) {
      // The schema's check constraint rejects a Task with both or neither of day and category.
      await updateTask(id, { day, category_id: categoryId, position });
    },
    async rollOverTo(day) {
      // The plan needs only the unfinished Tasks on days up to `day`.
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq("done", false)
        .lte("day", day);
      if (error) throw error;
      const plan = rolloverPlan((data as TaskRow[]).map(fromTaskRow), day);
      // Each update applies only while the Task is still unfinished on a Past
      // day, so running this again, or on two devices at once, changes nothing more.
      const results = await Promise.all(
        plan.map(({ id, position }) =>
          supabase
            .from("tasks")
            .update({ day, position, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("done", false)
            .lt("day", day),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
    },
    async clearDoneTasks(categoryId) {
      const { error } = await supabase.from("tasks").delete().eq("category_id", categoryId).eq("done", true);
      if (error) throw error;
    },

    subscribeToChanges(listener) {
      changeListeners.add(listener);
      if (!channel) channel = openChangesChannel();
      return () => {
        changeListeners.delete(listener);
        if (changeListeners.size === 0 && channel) {
          void supabase.removeChannel(channel);
          channel = null;
        }
      };
    },
  };

  async function updateTask(id: string, changes: Partial<TaskRow>) {
    requireRow(
      await supabase
        .from("tasks")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id"),
    );
  }

  async function updateCategory(id: string, changes: { name?: string; position?: string }) {
    requireRow(
      await supabase
        .from("categories")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id"),
    );
  }
}

/**
 * Throws unless an update or delete reached its row. Supabase reports no error
 * when the row is gone (say, deleted on another device), but the in-memory
 * backend rejects that, and the screen must be put back either way.
 */
function requireRow({ data, error }: { data: unknown[] | null; error: unknown }) {
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("That row no longer exists");
}

type SettingsRow = { day_count: number; theme: string | null };

function fromSettingsRow(row: SettingsRow): Settings {
  return { dayCount: row.day_count as DayCount, theme: row.theme as Theme | null };
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

