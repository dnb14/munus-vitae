import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type Backend, type DayCount, type Theme, type User } from "./backend";

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

