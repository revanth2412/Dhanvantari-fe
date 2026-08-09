import { supabase } from "@/lib/supabaseClient";

/** Supabase auth wrappers (email/password + Google OAuth). */
export const authService = {
  signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signUpWithPassword(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Return to the app after Google auth; Supabase restores the session.
        redirectTo: window.location.origin,
      },
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },
};
