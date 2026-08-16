import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Doctor } from "@/types/doctor";

/**
 * A single derived value the whole app routes on:
 *  - loading:         still resolving session / profile
 *  - unauthenticated: no Supabase session
 *  - unregistered:    signed in, but no doctor profile yet
 *  - revoked:         a platform admin disabled the account (`active === false`).
 *                     Global — it blocks the doctor in every clinic.
 *  - no_clinic:       usable account with no clinic selected yet; they must
 *                     create or join one before any clinical route works
 *  - approved:        good to go
 *
 * Signup no longer needs admin approval, so there is deliberately no `pending`
 * state. Clinic-level revocation is NOT visible here (the profile carries no
 * membership flags) — `ClinicGate` handles that inside the app shell.
 */
export type AuthStatus =
  "loading" | "unauthenticated" | "unregistered" | "revoked" | "no_clinic" | "approved";

export interface AuthContextValue {
  session: Session | null;
  doctor: Doctor | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
