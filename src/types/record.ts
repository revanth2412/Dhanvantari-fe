/** Mirrors backend `ClinicalNote` (app/schemas/clinical_note.py) and `RecordOut`. */
import type { SocialHistory } from "@/types/patient";

export interface NotePatientInfo {
  name?: string | null;
  age?: string | null;
  gender?: string | null;
  identifiers_mentioned?: string[];
}

export interface Symptom {
  name: string;
  duration?: string | null;
  severity?: string | null;
  notes?: string | null;
}

export interface NoteHistory {
  medical?: string[];
  medications_current?: string[];
  allergies?: string[];
}

export interface Vital {
  type: string;
  value: string;
}

export interface Diagnosis {
  condition: string;
  certainty?: string | null;
  icd10_hint?: string | null;
}

export interface Prescription {
  drug: string;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
}

export interface FollowUp {
  required?: boolean;
  after_days?: number | null;
  reason?: string | null;
}

export interface ClinicalNote {
  patient?: NotePatientInfo;
  social_history?: SocialHistory;
  chief_complaint?: string | null;
  symptoms?: Symptom[];
  history?: NoteHistory;
  vitals_mentioned?: Vital[];
  diagnosis?: Diagnosis[];
  prescriptions?: Prescription[];
  tests_ordered?: string[];
  advice?: string[];
  follow_up?: FollowUp;
  red_flags?: string[];
  extraction_confidence?: number;
  unclear_segments?: string[];
}

export type RecordStatus = "draft" | "final";

export interface ClinicalRecord {
  id: string;
  consultation_id: string;
  patient_id: string;
  data: ClinicalNote;
  version: number;
  status: RecordStatus;
  confidence: number | null;
  /* Signatures are server-derived from the authenticated doctor — a client
     can't set who reviewed or signed a clinical record. */
  reviewed_by: string | null;
  reviewed_by_id: string | null;
  finalized_by: string | null;
  finalized_by_id: string | null;
  finalized_at: string | null;
  created_at: string;
}

/** Payload for `PUT /records/{id}` — creates a new version. */
export interface RecordUpdateInput {
  data: ClinicalNote;
}
