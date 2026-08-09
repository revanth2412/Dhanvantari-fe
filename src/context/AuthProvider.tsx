import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

  const loadProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setDoctor(null);
      return;
    }
    const token = ++fetchToken.current;
    setProfileLoading(true);
    try {
      const profile = await getMyProfile();
      if (token === fetchToken.current) setDoctor(profile);
    } catch {
      if (token === fetchToken.current) setDoctor(null);
    } finally {
      if (token === fetchToken.current) setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (mounted) setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      void loadProfile(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

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
