import { apiRequest } from "@/lib/apiClient";
import type {
  Consultation,
  ConsultationCreateInput,
  Recording,
  Transcript,
} from "@/types/consultation";

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

/** Latest diarized transcript (404 while not ready). */
export function getTranscript(consultationId: string): Promise<Transcript> {
  return apiRequest<Transcript>(`/consultations/${consultationId}/transcript`);
}
