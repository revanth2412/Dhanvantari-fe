/** Admin-only DTOs (backend `app/schemas/api.py` admin views). */
import type { Doctor } from "@/types/doctor";
import type { ConsultationStatus } from "@/types/consultation";

/** Per-doctor consultation breakdown (`DoctorStats`). Also returned by
 *  `GET /stats/me` for the signed-in doctor's own activity. */
export interface DoctorStats {
  total_consultations: number;
  finalized: number;
  draft_ready: number;
  in_progress: number;
  failed: number;
  discarded: number;
  patients_seen: number;
  consultations_last_7_days: number;
  consultations_last_30_days: number;
  /** Measured audio captured across this doctor's consultations. */
  recorded_seconds: number;
}

/** Row shape for `GET /admin/doctors` — adds a quick consultation count. */
export interface DoctorAdmin extends Doctor {
  consultation_count: number;
}

/** `GET /admin/doctors/{id}` — the doctor plus full stats. */
export interface DoctorDetail extends Doctor {
  stats: DoctorStats;
}

/**
 * Consultation row for admin oversight.
 *
 * Deliberately carries NO patient PII (no name/phone/DOB): under India's DPDP
 * Act the platform admin isn't a care provider for the patient, so oversight is
 * limited to operational metadata. `patient_id` is an opaque reference only.
 */
export interface ConsultationAdmin {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  status: ConsultationStatus;
  consent_confirmed: boolean;
  created_at: string;
}

/** `GET /admin/stats` — system-wide totals. */
export interface AdminStats {
  clinics_total: number;
  clinics_active: number;
  doctors_total: number;
  doctors_pending: number;
  doctors_approved: number;
  doctors_rejected: number;
  doctors_active: number;
  doctors_unassigned: number;
  admins: number;
  patients_total: number;
  consultations_total: number;
  consultations_finalized: number;
  consultations_draft_ready: number;
  consultations_in_progress: number;
  consultations_failed: number;
  consultations_discarded: number;
  consultations_last_7_days: number;
  consultations_last_30_days: number;
}

/** Filters accepted by `GET /admin/doctors`. */
export interface AdminDoctorFilters {
  approval_status?: Doctor["approval_status"];
  active?: boolean;
  clinic_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/** Filters accepted by `GET /admin/clinics`. */
export interface AdminClinicFilters {
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}
