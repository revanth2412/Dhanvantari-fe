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
}
