/** Mirrors the backend `DoctorOut` schema. */
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type Role = "doctor" | "admin";

export interface Doctor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  registration_no: string | null;
  address: string | null;
  /** Clinic the doctor belongs to; null until they create or join one. */
  clinic_id: string | null;
  clinic_name: string | null;
  active: boolean;
  role: Role;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
}

/** Payload for `POST /auth/register`. */
export interface DoctorRegisterInput {
  full_name: string;
  phone?: string | null;
  specialty?: string | null;
  registration_no?: string | null;
  address?: string | null;
}

/**
 * Payload for `PATCH /auth/me` (backend `DoctorSelfUpdate`).
 * Email, role, approval status and active flag are deliberately absent —
 * email is tied to the auth account and the rest are admin-controlled.
 */
export interface DoctorSelfUpdateInput {
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  specialty?: string | null;
  registration_no?: string | null;
}

/** Editable fields accepted by `PATCH /doctors/{doctor_id}`. */
export interface DoctorUpdateInput {
  full_name?: string | null;
  phone?: string | null;
  specialty?: string | null;
  registration_no?: string | null;
  address?: string | null;
}
