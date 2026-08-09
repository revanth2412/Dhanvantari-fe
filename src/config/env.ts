/**
 * Centralized, validated access to environment variables.
 * Fails fast at startup if a required variable is missing.
 */
function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to your .env file (see .env.example).`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("VITE_SUPABASE_URL"),
  supabaseAnonKey: required("VITE_SUPABASE_ANON_KEY"),
  apiBaseUrl: required("VITE_API_BASE_URL").replace(/\/$/, ""),
} as const;
