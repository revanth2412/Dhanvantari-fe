import { apiRequest } from "@/lib/apiClient";
import type {
  AdminClinicFilters,
  AdminDoctorFilters,
  AdminStats,
  ConsultationAdmin,
  DoctorAdmin,
  DoctorDetail,
} from "@/types/admin";
import type {
  Clinic,
  ClinicAdmin,
  ClinicCreateInput,
  ClinicMember,
  ClinicStats,
} from "@/types/clinic";
import type { Doctor } from "@/types/doctor";

/**
 * Platform-admin API.
 *
 * NOTE: signup no longer needs approval, so there are no approve/reject
 * endpoints — access control is now revoke/activate at two levels:
 *   - doctor  (`/admin/doctors/{id}/revoke`)  — blocks them in EVERY clinic;
 *   - clinic  (`/admin/clinics/{id}/revoke`)  — blocks that clinic for everyone,
 *     but its doctors can still work in other clinics they belong to.
 * Admin views never carry patient PII (DPDP).
 */

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

/* ---------------- Clinics ---------------- */

export function listClinics(filters: AdminClinicFilters = {}): Promise<ClinicAdmin[]> {
  return apiRequest<ClinicAdmin[]>(`/admin/clinics${qs({ ...filters })}`);
}

export function getClinic(clinicId: string): Promise<ClinicAdmin> {
  return apiRequest<ClinicAdmin>(`/admin/clinics/${clinicId}`);
}

export function createClinicAsAdmin(
  input: ClinicCreateInput & { active?: boolean },
): Promise<Clinic> {
  return apiRequest<Clinic>("/admin/clinics", { method: "POST", body: input });
}

export function updateClinic(
  clinicId: string,
  input: Partial<ClinicCreateInput> & { active?: boolean },
): Promise<Clinic> {
  return apiRequest<Clinic>(`/admin/clinics/${clinicId}`, {
    method: "PATCH",
    body: input,
  });
}

/** Revoke a whole clinic: nobody can work in it until reactivated. */
export function revokeClinic(clinicId: string): Promise<Clinic> {
  return apiRequest<Clinic>(`/admin/clinics/${clinicId}/revoke`, { method: "POST" });
}

export function activateClinic(clinicId: string): Promise<Clinic> {
  return apiRequest<Clinic>(`/admin/clinics/${clinicId}/activate`, { method: "POST" });
}

export function getClinicStats(clinicId: string): Promise<ClinicStats> {
  return apiRequest<ClinicStats>(`/admin/clinics/${clinicId}/stats`);
}

/** Doctors in a clinic, with their membership role/active state. */
export function getClinicDoctors(clinicId: string): Promise<ClinicMember[]> {
  return apiRequest<ClinicMember[]>(`/admin/clinics/${clinicId}/doctors`);
}

export function getClinicConsultations(
  clinicId: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<ConsultationAdmin[]> {
  return apiRequest<ConsultationAdmin[]>(
    `/admin/clinics/${clinicId}/consultations${qs({ ...params })}`,
  );
}

/** Assign (or with `clinicId: null`, unassign) a doctor's active clinic. */
export function assignDoctorClinic(
  doctorId: string,
  clinicId: string | null,
  reassignPatients = true,
): Promise<Doctor> {
  return apiRequest<Doctor>(
    `/admin/doctors/${doctorId}/clinic${qs({ reassign_patients: reassignPatients })}`,
    { method: "POST", body: { clinic_id: clinicId } },
  );
}

/* ---------------- Doctors ---------------- */

export function listDoctors(filters: AdminDoctorFilters = {}): Promise<DoctorAdmin[]> {
  return apiRequest<DoctorAdmin[]>(`/admin/doctors${qs({ ...filters })}`);
}

export function getDoctorDetail(doctorId: string): Promise<DoctorDetail> {
  return apiRequest<DoctorDetail>(`/admin/doctors/${doctorId}`);
}

export function getDoctorConsultations(
  doctorId: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<ConsultationAdmin[]> {
  return apiRequest<ConsultationAdmin[]>(
    `/admin/doctors/${doctorId}/consultations${qs({ ...params })}`,
  );
}

/** Global kill switch — the doctor is blocked in every clinic. */
export function revokeDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/revoke`, { method: "POST" });
}

export function activateDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/activate`, { method: "POST" });
}

export function makeAdmin(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/make-admin`, { method: "POST" });
}

/* ---------------- System views ---------------- */

export function listAllConsultations(
  params: {
    doctor_id?: string;
    clinic_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ConsultationAdmin[]> {
  return apiRequest<ConsultationAdmin[]>(`/admin/consultations${qs({ ...params })}`);
}

export function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats");
}
