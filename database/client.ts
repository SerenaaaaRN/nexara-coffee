import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Client Supabase browser-side (publishable key).
 * Dipakai untuk Realtime broadcast/presence. DML tetap lewat server function
 * (supabaseAdmin) — browser tidak query PostgREST langsung.
 */
export function createSupabaseBrowserClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_KEY as
    | string
    | undefined;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "VITE_SUPABASE_URL dan VITE_SUPABASE_KEY harus di-set untuk klien browser",
    );
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
}
