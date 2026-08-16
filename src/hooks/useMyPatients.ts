import { useMemo } from "react";
import { getClinicConsultations } from "@/services/clinicService";
import type { ClinicConsultation } from "@/types/clinic";
import type { Patient } from "@/types/patient";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useClinicRole } from "@/hooks/useClinicRole";

export interface MyPatients {
  /** The doctor's own patients — `null` while the answer isn't known yet. */
  patients: Patient[] | null;
  /** True when the clinic-wide list was narrowed to this doctor's patients. */
  narrowed: boolean;
  /** Clinic patients left out of the narrowed list (0 for regular doctors). */
  hiddenCount: number;
}

/**
 * Keeps a doctor's roster personal, including for a clinic admin.
 *
 * `GET /patients` is widened to the whole clinic for a clinic admin
 * (`app/scoping.py`) — right for oversight, wrong for their own working list.
 * So for an admin we intersect it with the patients they have actually
 * consulted, taken from their clinic's consultation log. The clinic-wide view
 * lives on the clinic page instead.
 *
 * A regular doctor is already scoped server-side: the list passes straight
 * through and no extra request is made.
 *
 * Known limit: both endpoints return recent windows — `/patients` the 50 most
 * recently registered, `/clinics/me/consultations` the 200 most recent — so the
 * intersection is exact within those windows and can miss a long-dormant
 * patient in a high-volume clinic. A `mine=true` filter on `GET /patients` is
 * the proper fix and would let this hook disappear entirely.
 */
export function useMyPatients(patients: Patient[] | null): MyPatients {
  const { doctor } = useAuth();
  const { isClinicAdmin } = useClinicRole();

  const consultationsQuery = useCachedQuery<ClinicConsultation[]>(
    "clinic:consultations",
    getClinicConsultations,
    { enabled: isClinicAdmin, ttlMs: 120_000 },
  );

  return useMemo(() => {
    if (!isClinicAdmin) {
      return { patients, narrowed: false, hiddenCount: 0 };
    }
    if (!consultationsQuery.data) {
      // Still loading: hold the skeleton rather than flash the clinic-wide
      // list. Failed: show an empty roster, never someone else's patients —
      // and never an endless skeleton either.
      return consultationsQuery.error
        ? { patients: [], narrowed: true, hiddenCount: patients?.length ?? 0 }
        : { patients: null, narrowed: true, hiddenCount: 0 };
    }

    const mine = new Set(
      consultationsQuery.data
        .filter((c) => c.doctor_id === doctor?.id)
        .map((c) => c.patient_id),
    );
    const list = (patients ?? []).filter((p) => mine.has(p.id));
    return {
      patients: patients === null ? null : list,
      narrowed: true,
      hiddenCount: patients === null ? 0 : patients.length - list.length,
    };
  }, [
    patients,
    isClinicAdmin,
    consultationsQuery.data,
    consultationsQuery.error,
    doctor?.id,
  ]);
}
