/** Admin-only DTOs (backend `app/schemas/api.py` admin views). */
import type { Doctor } from "@/types/doctor";
import type { ConsultationStatus } from "@/types/consultation";

/** Per-doctor consultation breakdown (`DoctorStats`). */
export interface DoctorStats {
  total_consultations: number;
  finalized: number;
  draft_ready: number;
  in_progress: number;
  failed: number;
  discarded: number;
  patients_seen: number;
}

/** Row shape for `GET /admin/doctors` — adds a quick consultation count. */
export interface DoctorAdmin extends Doctor {
  consultation_count: number;
}

/** `GET /admin/doctors/{id}` — the doctor plus full stats. */
export interface DoctorDetail extends Doctor {
  stats: DoctorStats;
}

/** Consultation row for admin oversight; includes the patient's name. */
export interface ConsultationAdmin {
  id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_id: string | null;
  status: ConsultationStatus;
  consent_confirmed: boolean;
  created_at: string;
}

/** `GET /admin/stats` — system-wide totals. */
export interface AdminStats {
  doctors_total: number;
  doctors_pending: number;
  doctors_approved: number;
  doctors_rejected: number;
  doctors_active: number;
  admins: number;
  patients_total: number;
  consultations_total: number;
  consultations_finalized: number;
  consultations_draft_ready: number;
  consultations_in_progress: number;
  consultations_failed: number;
  consultations_discarded: number;
}

/** Filters accepted by `GET /admin/doctors`. */
export interface AdminDoctorFilters {
  approval_status?: Doctor["approval_status"];
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
