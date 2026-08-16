import { apiList, apiRequest, queryString, type Page } from "@/lib/apiClient";
import type {
  Consultation,
  ConsultationCreateInput,
  ConsultationFilters,
  ConsultationListItem,
  Recording,
  Transcript,
} from "@/types/consultation";

/**
 * `GET /consultations` — the caller's consultations, newest first: their own
 * for a regular doctor, the whole clinic for a clinic admin. Filtering by date
 * and status happens server-side, so the list is authoritative rather than
 * whatever this browser happens to remember.
 */
export function listConsultations(
  filters: ConsultationFilters = {},
  signal?: AbortSignal,
): Promise<Page<ConsultationListItem>> {
  const qs = queryString({
    patient_id: filters.patient_id,
    status: filters.status,
    from: filters.from,
    to: filters.to,
    limit: filters.limit,
    offset: filters.offset,
  });
  return apiList<ConsultationListItem>(`/consultations${qs}`, { signal });
}

export function createConsultation(
  input: ConsultationCreateInput,
): Promise<Consultation> {
  return apiRequest<Consultation>("/consultations", { method: "POST", body: input });
}

export function getConsultation(
  consultationId: string,
  signal?: AbortSignal,
): Promise<Consultation> {
  return apiRequest<Consultation>(`/consultations/${consultationId}`, { signal });
}

/** Upload the consultation audio (multipart) — triggers the STT+extract pipeline. */
export function uploadRecording(
  consultationId: string,
  file: Blob,
  filename: string,
): Promise<Recording> {
  const formData = new FormData();
  formData.append("file", file, filename);
  return apiRequest<Recording>(`/consultations/${consultationId}/recording`, {
    method: "POST",
    formData,
  });
}

/** Re-run the pipeline on the latest recording (recovery / regenerate). */
export function reprocessConsultation(consultationId: string): Promise<Consultation> {
  return apiRequest<Consultation>(`/consultations/${consultationId}/process`, {
    method: "POST",
  });
}

/**
 * Soft-discard a consultation (`status -> discarded`). The owning doctor or an
 * admin may discard; a finalized consultation cannot be (409).
 */
export function discardConsultation(consultationId: string): Promise<Consultation> {
  return apiRequest<Consultation>(`/consultations/${consultationId}/discard`, {
    method: "POST",
  });
}

/** Latest recording metadata — `duration_s` is the measured audio length. */
export function getRecording(consultationId: string): Promise<Recording> {
  return apiRequest<Recording>(`/consultations/${consultationId}/recording`);
}

/** Latest diarized transcript (404 while not ready). */
export function getTranscript(consultationId: string): Promise<Transcript> {
  return apiRequest<Transcript>(`/consultations/${consultationId}/transcript`);
}
