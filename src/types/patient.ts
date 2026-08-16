/** Mirrors backend `PatientOut` / `SocialHistory` (app/schemas). */

export interface SubstanceUse {
  status?: string | null;
  detail?: string | null;
}

export interface SocialHistory {
  residence?: string | null;
  occupation?: string | null;
  family_details?: string | null;
  marital_status?: string | null;
  smoking?: SubstanceUse;
  alcohol?: SubstanceUse;
  recreational_drugs?: SubstanceUse;
  exercise?: string | null;
  diet?: string | null;
  commute?: string | null;
  mental_health?: string | null;
  other?: string[];
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  language_pref: string | null;
  do_not_call: boolean;
  /** Clinic that owns this patient — the backend scopes every read to it. */
  clinic_id: string | null;
  /** Doctor who registered them; `GET /patients?mine=true` filters on this. */
  created_by_id: string | null;
  social_history: SocialHistory;
  created_at: string;
}

/** Payload for `POST /patients`. */
export interface PatientCreateInput {
  full_name: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  language_pref?: string | null;
  do_not_call?: boolean;
  social_history?: SocialHistory | null;
}

/** Payload for `PATCH /patients/{id}` — all fields optional. */
export type PatientUpdateInput = Partial<PatientCreateInput>;
