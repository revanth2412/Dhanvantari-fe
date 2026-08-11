import { apiRequest } from "@/lib/apiClient";
import type {
  AdminDoctorFilters,
  AdminStats,
  ConsultationAdmin,
  DoctorAdmin,
  DoctorDetail,
} from "@/types/admin";
import type { ApprovalStatus, Doctor } from "@/types/doctor";

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

/* ---------------- Doctors ---------------- */

/** `GET /admin/doctors` — rows carry a non-discarded consultation count. */
export function listDoctors(filters: AdminDoctorFilters = {}): Promise<DoctorAdmin[]> {
  return apiRequest<DoctorAdmin[]>(`/admin/doctors${qs({ ...filters })}`);
}

/** `GET /admin/doctors/{id}` — profile plus full consultation stats. */
export function getDoctorDetail(doctorId: string): Promise<DoctorDetail> {
  return apiRequest<DoctorDetail>(`/admin/doctors/${doctorId}`);
}

/** `GET /admin/doctors/{id}/consultations` — that doctor's consultations. */
export function getDoctorConsultations(
  doctorId: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<ConsultationAdmin[]> {
  return apiRequest<ConsultationAdmin[]>(
    `/admin/doctors/${doctorId}/consultations${qs({ ...params })}`,
  );
}

/* ---------------- Access control ---------------- */

export function approveDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/approve`, { method: "POST" });
}

export function rejectDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/reject`, { method: "POST" });
}

/** Deactivate an approved doctor without rejecting them. */
export function revokeDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/revoke`, { method: "POST" });
}

/** Restore access to a deactivated doctor. */
export function activateDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/activate`, { method: "POST" });
}

export function makeAdmin(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/make-admin`, { method: "POST" });
}

/* ---------------- System views ---------------- */

/** `GET /admin/consultations` — discarded rows are excluded unless `status` asks for them. */
export function listAllConsultations(
  params: { doctor_id?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<ConsultationAdmin[]> {
  return apiRequest<ConsultationAdmin[]>(`/admin/consultations${qs({ ...params })}`);
}

export function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats");
}

/** Re-exported for callers that filter by approval status. */
export type { ApprovalStatus };
