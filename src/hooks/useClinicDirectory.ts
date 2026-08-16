import { useMemo } from "react";
import { getClinicMembers } from "@/services/clinicService";
import type { ClinicMember } from "@/types/clinic";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useClinicRole } from "@/hooks/useClinicRole";

/**
 * Resolves a doctor id to a display name within the active clinic.
 *
 * `GET /clinics/me/members` is clinic-admin only, and that lines up exactly
 * with who needs it: a regular doctor can only ever open their own
 * consultations (see `app/scoping.py`), so the only id they ever resolve is
 * their own. Clinic admins, who can open a colleague's consultation, are also
 * the ones allowed to list members.
 *
 * Shares the `clinic:me` / `clinic:members` cache keys with the clinic page, so
 * visiting both costs one round-trip, not two.
 */
export function useClinicDirectory() {
  const { doctor } = useAuth();
  const { isClinicAdmin } = useClinicRole();

  const membersQuery = useCachedQuery<ClinicMember[]>(
    "clinic:members",
    getClinicMembers,
    { enabled: isClinicAdmin, ttlMs: 300_000 },
  );

  const byId = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      map.set(member.doctor_id, member.full_name);
    }
    return map;
  }, [membersQuery.data]);

  return useMemo(
    () => ({
      isClinicAdmin,
      /** Display name for a doctor id — `null` when it can't be resolved. */
      nameFor(doctorId: string | null | undefined): string | null {
        if (!doctorId) return null;
        if (doctorId === doctor?.id) return doctor?.full_name ?? "You";
        return byId.get(doctorId) ?? null;
      },
      /** True when the id is the signed-in doctor. */
      isSelf(doctorId: string | null | undefined): boolean {
        return Boolean(doctorId && doctorId === doctor?.id);
      },
    }),
    [byId, doctor?.id, doctor?.full_name, isClinicAdmin],
  );
}
