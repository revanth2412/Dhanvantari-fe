import { apiRequest } from "@/lib/apiClient";
import type { Patient, PatientCreateInput, PatientUpdateInput } from "@/types/patient";

/** Search patients by name/phone (backend caps at 50). Empty search = latest. */
export function searchPatients(search = "", signal?: AbortSignal): Promise<Patient[]> {
  const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return apiRequest<Patient[]>(`/patients${qs}`, { signal });
}

export function getPatient(patientId: string): Promise<Patient> {
  return apiRequest<Patient>(`/patients/${patientId}`);
}

export function createPatient(input: PatientCreateInput): Promise<Patient> {
  return apiRequest<Patient>("/patients", { method: "POST", body: input });
}

export function updatePatient(
  patientId: string,
  input: PatientUpdateInput,
): Promise<Patient> {
  return apiRequest<Patient>(`/patients/${patientId}`, {
    method: "PATCH",
    body: input,
  });
}
