/**
 * Local "recent sessions" store.
 *
 * The backend has no "list consultations" endpoint yet, so the dashboard keeps
 * a small per-doctor recent-session log in localStorage. Entries are written
 * whenever a consultation is created or its status observed, and read on the
 * dashboard. Purely a UX cache — safe to lose.
 */
import type { ConsultationStatus } from "@/types/consultation";

export interface RecentSession {
  consultationId: string;
  patientId: string;
  patientName: string;
  status: ConsultationStatus;
  updatedAt: string; // ISO
}

const LIMIT = 12;

function keyFor(doctorId: string): string {
  return `medivaani.recents.${doctorId}`;
}

function legacyKeyFor(doctorId: string): string {
  return `dhanvantari.recents.${doctorId}`;
}

export function getRecentSessions(doctorId: string): RecentSession[] {
  try {
    const raw =
      localStorage.getItem(keyFor(doctorId)) ||
      localStorage.getItem(legacyKeyFor(doctorId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentSession[]) : [];
  } catch {
    return [];
  }
}

export function rememberSession(
  doctorId: string,
  session: Omit<RecentSession, "updatedAt">,
): void {
  try {
    const rest = getRecentSessions(doctorId).filter(
      (s) => s.consultationId !== session.consultationId,
    );
    const next: RecentSession[] = [
      { ...session, updatedAt: new Date().toISOString() },
      ...rest,
    ].slice(0, LIMIT);
    localStorage.setItem(keyFor(doctorId), JSON.stringify(next));
  } catch {
    // storage unavailable — recents are best-effort only
  }
}
