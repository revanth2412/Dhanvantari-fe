/**
 * Clinics & memberships (backend `app/api/clinics.py`).
 *
 * A doctor account can belong to SEVERAL clinics through `ClinicMember`.
 * `doctors.clinic_id` is merely the *currently-selected* one, changed with
 * `POST /clinics/switch`.
 *
 * Access is gated at three independent levels (see `app/auth.py`):
 *   1. `doctor.active`        — global kill switch, blocks every clinic;
 *   2. membership `active`    — revoked from THIS clinic only;
 *   3. `clinic.active`        — the whole clinic is revoked.
 *
 * Within a clinic, the membership `role` decides visibility: an `admin`
 * (the doctor who created the clinic) sees every patient/consultation in it,
 * a `doctor` sees only their own.
 */
import type { ConsultationStatus } from "@/types/consultation";

export type ClinicRole = "admin" | "doctor";

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  city: string | null;
  registration_no: string | null;
  /** Invite code colleagues use to join this clinic. */
  join_code: string;
  active: boolean;
  created_at: string;
}

/** `GET /clinics/me` — the active clinic plus the caller's role in it. */
export interface MyClinic extends Clinic {
  role: ClinicRole;
}

/** `GET /clinics/mine` — one row per clinic the doctor belongs to. */
export interface ClinicMembership {
  clinic_id: string;
  name: string;
  city: string | null;
  role: ClinicRole;
  /** This doctor's membership is active (false = revoked from this clinic). */
  active: boolean;
  /** The clinic itself is active (false = platform admin revoked it). */
  clinic_active: boolean;
  is_current: boolean;
}

/** `GET /clinics/me/members` — a colleague's membership row. */
export interface ClinicMember {
  doctor_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  role: ClinicRole;
  /** Membership in this clinic. */
  active: boolean;
  /** Global account flag — false means revoked everywhere. */
  doctor_active: boolean;
  joined_at: string;
}

/**
 * Clinic-wide consultation row. Unlike the platform-admin views this DOES
 * carry the patient name: a clinic admin is a care provider within their own
 * clinic, so PII is appropriate here.
 */
export interface ClinicConsultation {
  id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_id: string | null;
  status: ConsultationStatus;
  consent_confirmed: boolean;
  created_at: string;
}

/** `GET /clinics/me/stats` and `GET /admin/clinics/{id}/stats`. */
export interface ClinicStats {
  doctors_total: number;
  doctors_active: number;
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

export interface ClinicCreateInput {
  name: string;
  address?: string | null;
  phone?: string | null;
  city?: string | null;
  registration_no?: string | null;
}

/** `PATCH /clinics/me` — clinic admin only; `active` is platform-admin territory. */
export type ClinicUpdateInput = Partial<ClinicCreateInput>;

export interface ClinicJoinInput {
  join_code: string;
}

/** `GET /admin/clinics` row — adds membership/activity counts. */
export interface ClinicAdmin extends Clinic {
  doctor_count: number;
  patient_count: number;
  consultation_count: number;
}
