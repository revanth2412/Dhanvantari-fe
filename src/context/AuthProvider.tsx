import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { authService } from "@/services/authService";
import { getMyProfile } from "@/services/doctorService";
import type { Doctor } from "@/types/doctor";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "@/context/authContext";

function deriveStatus(session: Session | null, doctor: Doctor | null): AuthStatus {
  if (!session) return "unauthenticated";
  if (!doctor) return "unregistered";
  if (doctor.approval_status === "approved" && doctor.active) return "approved";
  if (doctor.approval_status === "rejected" || !doctor.active) return "rejected";
  return "pending";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  // Guards against overlapping profile fetches from rapid auth events.
  const fetchToken = useRef(0);
  // Once we have a profile, later auth events (e.g. TOKEN_REFRESHED when the
  // tab regains focus) must refresh silently — never flash the app loader.
  const doctorRef = useRef<Doctor | null>(null);
  doctorRef.current = doctor;
  const lastUserId = useRef<string | null>(null);

  const loadProfile = useCallback(
    async (activeSession: Session | null, { silent = false } = {}) => {
      if (!activeSession) {
        setDoctor(null);
        return;
      }
      const token = ++fetchToken.current;
      if (!silent) setProfileLoading(true);
      try {
        const profile = await getMyProfile();
        if (token === fetchToken.current) setDoctor(profile);
      } catch {
        if (token === fetchToken.current) setDoctor(null);
      } finally {
        if (token === fetchToken.current && !silent) setProfileLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      lastUserId.current = data.session?.user.id ?? null;
      await loadProfile(data.session);
      if (mounted) setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const userId = newSession?.user.id ?? null;
      const sameUser = userId !== null && userId === lastUserId.current;
      lastUserId.current = userId;
      // Same user + profile already loaded (token refresh on tab focus):
      // nothing to fetch, and definitely nothing to show a loader for.
      if (sameUser && doctorRef.current) return;
      void loadProfile(newSession, { silent: sameUser });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Silent: status polls (pending screen) and post-register refreshes must not
  // flash the full-screen loader.
  const refreshProfile = useCallback(
    () => loadProfile(session, { silent: true }),
    [loadProfile, session],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setDoctor(null);
  }, []);

  const status: AuthStatus =
    initializing || profileLoading ? "loading" : deriveStatus(session, doctor);

  const value = useMemo<AuthContextValue>(
    () => ({ session, doctor, status, refreshProfile, signOut }),
    [session, doctor, status, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
