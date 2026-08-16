import { apiRequest, ApiError } from "@/lib/apiClient";
import type {
  Doctor,
  DoctorRegisterInput,
  DoctorSelfUpdateInput,
  DoctorUpdateInput,
} from "@/types/doctor";

/**
 * Fetch the authenticated doctor's profile.
 * Returns `null` when the account exists in Supabase but has no profile yet
 * (backend responds 404 -> the user must complete registration).
 */
export async function getMyProfile(): Promise<Doctor | null> {
  try {
    return await apiRequest<Doctor>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/** Create the doctor profile for the authenticated Supabase user. */
export async function registerProfile(input: DoctorRegisterInput): Promise<Doctor> {
  return apiRequest<Doctor>("/auth/register", { method: "POST", body: input });
}

/**
 * Update the signed-in doctor's own profile (`PATCH /auth/me`).
 * Only name, phone, address, specialty and registration number are editable —
 * email is tied to the auth account, and role/approval/active are admin-only.
 */
export async function updateMyProfile(input: DoctorSelfUpdateInput): Promise<Doctor> {
  return apiRequest<Doctor>("/auth/me", { method: "PATCH", body: input });
}

/*
 * NOTE: there is no self-service "request access again" endpoint any more —
 * `POST /auth/reapply` was removed when signup stopped requiring approval.
 * Restoring a revoked account is an admin action:
 *   - globally revoked  -> `POST /admin/doctors/{id}/activate` (platform admin)
 *   - revoked in one clinic -> `POST /clinics/me/members/{id}/activate` (clinic admin)
 */

/** `GET /doctors/{doctor_id}` — load a doctor's current profile details. */
export function getDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/doctors/${doctorId}`);
}

/**
 * `PATCH /doctors/{doctor_id}` — update the profile fields exposed in Settings.
 * Account access controls intentionally stay out of the self-service UI.
 */
export function updateDoctor(
  doctorId: string,
  input: DoctorUpdateInput,
): Promise<Doctor> {
  return apiRequest<Doctor>(`/doctors/${doctorId}`, { method: "PATCH", body: input });
}
