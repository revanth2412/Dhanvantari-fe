import { apiRequest } from "@/lib/apiClient";
import type { ClinicalRecord, RecordUpdateInput } from "@/types/record";

/** Latest clinical note for a consultation (404 while not ready). */
export function getConsultationRecord(consultationId: string): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/consultations/${consultationId}/record`);
}

export function getRecord(recordId: string): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/records/${recordId}`);
}

/**
 * Doctor edit — the backend creates a NEW draft version (never overwrites) and
 * stamps `reviewed_by` from the authenticated doctor. Don't send a name: it's
 * the signature on a clinical record and the server ignores a client-supplied
 * one.
 */
export function updateRecord(
  recordId: string,
  input: RecordUpdateInput,
): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/records/${recordId}`, {
    method: "PUT",
    body: input,
  });
}

/** Sign off the current version. No body — the signer is the caller's JWT. */
export function finalizeRecord(recordId: string): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/records/${recordId}/finalize`, {
    method: "POST",
  });
}

/** Full (versioned) record history for a patient. */
export function getPatientRecords(patientId: string): Promise<ClinicalRecord[]> {
  return apiRequest<ClinicalRecord[]>(`/patients/${patientId}/records`);
}
