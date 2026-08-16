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
  // Signup is auto-approved; `active` is the only global gate an admin controls.
  if (!doctor.active) return "revoked";
  // Every clinical route needs a selected clinic (403 "select or create a clinic first").
  if (!doctor.clinic_id) return "no_clinic";
  return "approved";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  // Guards against overlapping profile fetches from rapid auth events.
  const fetchToken = useRef(0);
  // How many loads are currently showing the app loader.
  const pendingVisible = useRef(0);
  // Whose profile is being fetched right now (dedupes concurrent auth events).
  const inFlightUser = useRef<string | null>(null);
  // Once we have a profile, later auth events (e.g. TOKEN_REFRESHED when the
  // tab regains focus) must refresh silently — never flash the app loader.
  const doctorRef = useRef<Doctor | null>(null);
  doctorRef.current = doctor;
  const lastUserId = useRef<string | null>(null);

  const loadProfile = useCallback(
    async (activeSession: Session | null, { silent = false } = {}) => {
      if (!activeSession) {
        setDoctor(null);
        inFlightUser.current = null;
        return;
      }
      const token = ++fetchToken.current;
      inFlightUser.current = activeSession.user.id;
      // Count pending *visible* loads rather than tying the flag to the winning
      // token. Overlapping loads (init + SIGNED_IN fire together after an OAuth
      // redirect) previously left this stuck on, hanging the app on the loader
      // even though /auth/me had returned.
      if (!silent) {
        pendingVisible.current += 1;
        setProfileLoading(true);
      }
      try {
        const profile = await getMyProfile();
        if (token === fetchToken.current) setDoctor(profile);
      } catch {
        if (token === fetchToken.current) setDoctor(null);
      } finally {
        if (token === fetchToken.current) inFlightUser.current = null;
        if (!silent) {
          pendingVisible.current = Math.max(0, pendingVisible.current - 1);
          if (pendingVisible.current === 0) setProfileLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    // Last-resort guard: auth bootstrap must never leave the app on a loader,
    // whatever Supabase does. Cleared as soon as the session resolves.
    const safety = window.setTimeout(() => {
      if (mounted) setInitializing(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        lastUserId.current = data.session?.user.id ?? null;
        await loadProfile(data.session);
      })
      .finally(() => {
        window.clearTimeout(safety);
        if (mounted) setInitializing(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const userId = newSession?.user.id ?? null;
      const sameUser = userId !== null && userId === lastUserId.current;
      lastUserId.current = userId;
      // Same user, and the profile is already loaded (token refresh on tab
      // focus) or a load is already in flight (the SIGNED_IN event that follows
      // the initial getSession after an OAuth redirect) — nothing to do.
      if (sameUser && (doctorRef.current || inFlightUser.current === userId)) return;

      // IMPORTANT: supabase-js holds an internal auth lock for the duration of
      // this callback. loadProfile -> apiRequest -> supabase.auth.getSession()
      // would wait on that same lock and deadlock, leaving the app stuck on the
      // loader after an OAuth redirect. Defer to a macrotask so the lock is
      // released before we call back into Supabase.
      setTimeout(() => {
        if (!mounted) return;
        void loadProfile(newSession, { silent: sameUser }).finally(() => {
          // An OAuth redirect can resolve the session *after* the initial
          // getSession() settled; make sure we leave the loading state.
          if (mounted) setInitializing(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      window.clearTimeout(safety);
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
