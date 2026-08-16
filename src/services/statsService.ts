import { apiRequest } from "@/lib/apiClient";
import type { DoctorStats } from "@/types/admin";

/** `GET /stats/me` — the signed-in doctor's own consultation activity. */
export function getMyStats(): Promise<DoctorStats> {
  return apiRequest<DoctorStats>("/stats/me");
}
