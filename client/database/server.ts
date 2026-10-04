import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL (atau VITE_SUPABASE_URL) environment variable is not set",
  );
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
}

/**
 * Klien Supabase server-side (service_role, bypass RLS).
 * HANYA dipakai di server function — jangan pernah diimpor di komponen browser.
 * RLS tetap off; otorisasi tetap code-level via requireAccessAction().
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
