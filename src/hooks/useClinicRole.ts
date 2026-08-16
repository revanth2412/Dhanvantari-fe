import { getMyClinic } from "@/services/clinicService";
import type { MyClinic } from "@/types/clinic";
import { useCachedQuery } from "@/hooks/useCachedQuery";

/**
 * The doctor's role in their currently-selected clinic.
 *
 * `clinic.role === "admin"` is CLINIC admin (oversight of one clinic) and is a
 * different thing from `doctor.role === "admin"`, which is the platform admin.
 * Shares the `clinic:me` cache entry with the clinic page.
 */
export function useClinicRole() {
  const { data, loading } = useCachedQuery<MyClinic | null>("clinic:me", getMyClinic, {
    ttlMs: 300_000,
  });
  return {
    clinic: data ?? null,
    isClinicAdmin: data?.role === "admin",
    loading,
  };
}
