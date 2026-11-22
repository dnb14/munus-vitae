import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createInMemoryBackend } from "./backend/inMemoryBackend";
import "./styles.css";

// Ticket 02 swaps this for the Supabase backend outside of tests.
const backend = createInMemoryBackend();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App backend={backend} />
  </StrictMode>,
);
