import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { Backend } from "./backend/backend";
import { createInMemoryBackend } from "./backend/inMemoryBackend";
import { createSupabaseBackend } from "./backend/supabaseBackend";
import "@fontsource-variable/inter";
import "@fontsource-variable/outfit";
import "./styles.css";

function chooseBackend(): Backend {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) return createSupabaseBackend(url, key);

  if (import.meta.env.DEV) {
    console.warn(
      "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set: using the in-memory backend. " +
        "Run scripts/setup-supabase.sh to connect Supabase.",
    );
    return createInMemoryBackend();
  }
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set for a production build.");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App backend={chooseBackend()} />
  </StrictMode>,
);
