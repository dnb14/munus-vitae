import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { Backend, User } from "./backend";

/**
 * The real backend. Not covered by automated tests (see the spec's Testing
 * Decisions); verify by hand against a dev Supabase project.
 */
export function createSupabaseBackend(url: string, publishableKey: string): Backend {
  const supabase = createClient(url, publishableKey);

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
