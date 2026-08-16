import { apiRequest, ApiError } from "@/lib/apiClient";
import type {
  Clinic,
  ClinicConsultation,
  ClinicCreateInput,
  ClinicJoinInput,
  ClinicMember,
  ClinicMembership,
  ClinicStats,
  ClinicUpdateInput,
  MyClinic,
} from "@/types/clinic";

/**
 * Clinic membership & onboarding.
 *
 * These routes need only a usable account (`doctor.active`), not an active
 * clinic — that's deliberate, so a doctor whose current clinic was revoked can
 * still list their clinics and switch to another one.
 */

/* ---------------- membership ---------------- */

/** Create a clinic and become its **admin**. Switches your active clinic to it. */
export function createClinic(input: ClinicCreateInput): Promise<MyClinic> {
  return apiRequest<MyClinic>("/clinics", { method: "POST", body: input });
}

/** Join by invite code, as a regular `doctor`. 409 if already a member, or if
 *  a previous membership here was revoked (a clinic admin must restore it). */
export function joinClinic(input: ClinicJoinInput): Promise<MyClinic> {
  return apiRequest<MyClinic>("/clinics/join", {
    method: "POST",
    body: { join_code: input.join_code.trim().toUpperCase() },
  });
}

/** Change the active clinic to another one you're an active member of. */
export function switchClinic(clinicId: string): Promise<MyClinic> {
  return apiRequest<MyClinic>("/clinics/switch", {
    method: "POST",
    body: { clinic_id: clinicId },
  });
}

/** Every clinic the doctor belongs to — powers the clinic switcher. */
export function getMyClinics(): Promise<ClinicMembership[]> {
  return apiRequest<ClinicMembership[]>("/clinics/mine");
}

/** The active clinic + the caller's role. `null` when none is selected, and
 *  403 when access to it was revoked (surfaced via `ApiError`). */
export async function getMyClinic(): Promise<MyClinic | null> {
  try {
    return await apiRequest<MyClinic>("/clinics/me");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403))
      return null;
    throw err;
  }
}

/** Update the active clinic. Clinic admin only (403 otherwise). */
export function updateMyClinic(input: ClinicUpdateInput): Promise<MyClinic> {
  return apiRequest<MyClinic>("/clinics/me", { method: "PATCH", body: input });
}

/* ---------------- clinic-admin oversight ---------------- */
/* All 403 unless the caller is an admin of their active clinic. */

export function getClinicMembers(): Promise<ClinicMember[]> {
  return apiRequest<ClinicMember[]>("/clinics/me/members");
}

export function getClinicStats(): Promise<ClinicStats> {
  return apiRequest<ClinicStats>("/clinics/me/stats");
}

/** Clinic-wide consultations (includes patient names — see the type's note). */
export function getClinicConsultations(): Promise<ClinicConsultation[]> {
  return apiRequest<ClinicConsultation[]>("/clinics/me/consultations");
}

/** Revoke a colleague from THIS clinic only; their other clinics are unaffected. */
export function revokeClinicMember(doctorId: string): Promise<ClinicMember> {
  return apiRequest<ClinicMember>(`/clinics/me/members/${doctorId}/revoke`, {
    method: "POST",
  });
}

export function activateClinicMember(doctorId: string): Promise<ClinicMember> {
  return apiRequest<ClinicMember>(`/clinics/me/members/${doctorId}/activate`, {
    method: "POST",
  });
}

/** Promote a member to clinic admin (clinic-wide visibility + management). */
export function makeClinicMemberAdmin(doctorId: string): Promise<ClinicMember> {
  return apiRequest<ClinicMember>(`/clinics/me/members/${doctorId}/make-admin`, {
    method: "POST",
  });
}

/** Re-exported so callers don't need a second import for the clinic shape. */
export type { Clinic };
