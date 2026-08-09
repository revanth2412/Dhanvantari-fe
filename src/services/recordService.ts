import { apiRequest } from "@/lib/apiClient";
import type { ClinicalRecord, RecordUpdateInput } from "@/types/record";

/** Latest clinical note for a consultation (404 while not ready). */
export function getConsultationRecord(consultationId: string): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/consultations/${consultationId}/record`);
}

export function getRecord(recordId: string): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/records/${recordId}`);
}

/** Doctor edit — the backend creates a NEW draft version (never overwrites). */
export function updateRecord(
  recordId: string,
  input: RecordUpdateInput,
): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/records/${recordId}`, {
    method: "PUT",
    body: input,
  });
}

export function finalizeRecord(
  recordId: string,
  reviewedBy?: string | null,
): Promise<ClinicalRecord> {
  return apiRequest<ClinicalRecord>(`/records/${recordId}/finalize`, {
    method: "POST",
    body: { reviewed_by: reviewedBy ?? null },
  });
}

/** Full (versioned) record history for a patient. */
export function getPatientRecords(patientId: string): Promise<ClinicalRecord[]> {
  return apiRequest<ClinicalRecord[]>(`/patients/${patientId}/records`);
}
