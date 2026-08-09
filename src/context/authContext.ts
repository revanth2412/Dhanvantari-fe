import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Doctor } from "@/types/doctor";

/**
 * A single derived value the whole app routes on:
 *  - loading:         still resolving session / profile
 *  - unauthenticated: no Supabase session
 *  - unregistered:    signed in, but no doctor profile yet
 *  - pending:         profile awaiting admin approval
 *  - rejected:        profile rejected / deactivated
 *  - approved:        good to go
 */
export type AuthStatus =
  "loading" | "unauthenticated" | "unregistered" | "pending" | "rejected" | "approved";

export interface AuthContextValue {
  session: Session | null;
  doctor: Doctor | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
