import { apiList, apiRequest, queryString, type Page } from "@/lib/apiClient";
import type { Patient, PatientCreateInput, PatientUpdateInput } from "@/types/patient";

export interface PatientFilters {
  search?: string;
  /**
   * Narrow to patients this doctor registered. Matters only for a clinic
   * admin, whose scope is otherwise the whole clinic.
   */
  mine?: boolean;
  /** 1–200, backend default 50. */
  limit?: number;
  offset?: number;
}

/** `GET /patients` — a page of patients in scope, plus the total match count. */
export function listPatients(
  filters: PatientFilters = {},
  signal?: AbortSignal,
): Promise<Page<Patient>> {
  const qs = queryString({
    search: filters.search?.trim(),
    mine: filters.mine ? true : undefined,
    limit: filters.limit,
    offset: filters.offset,
  });
  return apiList<Patient>(`/patients${qs}`, { signal });
}

/** Convenience wrapper for callers that only need the rows. */
export async function searchPatients(
  search = "",
  signal?: AbortSignal,
): Promise<Patient[]> {
  const { items } = await listPatients({ search }, signal);
  return items;
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
