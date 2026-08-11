/** Mirrors backend `ConsultationOut` / `RecordingOut` / `TranscriptOut`. */

export type ConsultationStatus =
  | "recording"
  | "uploaded"
  | "transcribing"
  | "extracting"
  | "draft_ready"
  | "finalized"
  | "failed"
  /** Soft-deleted by the owning doctor or an admin; hidden from listings. */
  | "discarded";

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  status: ConsultationStatus;
  consent_confirmed: boolean;
  error_detail: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ConsultationCreateInput {
  patient_id: string;
  doctor_id?: string | null;
  consent_confirmed: boolean;
}

export interface Recording {
  id: string;
  consultation_id: string;
  format: string | null;
  duration_s: number | null;
  sha256: string;
  uploaded_at: string;
}

/** Diarized transcript segment (ElevenLabs Scribe output). */
export interface TranscriptSegment {
  start: number | null;
  end: number | null;
  speaker: string | null;
  text: string;
}

export interface Transcript {
  id: string;
  recording_id: string;
  engine: string;
  language_detected: string | null;
  segments: TranscriptSegment[] | null;
  created_at: string;
}
