import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Single Supabase client for the whole app. Handles email/password + OAuth
 * (Google) sessions, persists them, and restores the session from the URL
 * after an OAuth redirect.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
