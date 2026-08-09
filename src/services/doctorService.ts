import { apiRequest, ApiError } from "@/lib/apiClient";
import type { Doctor, DoctorRegisterInput } from "@/types/doctor";

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
