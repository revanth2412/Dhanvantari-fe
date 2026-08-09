import { apiRequest } from "@/lib/apiClient";
import type { ApprovalStatus, Doctor } from "@/types/doctor";

export function listDoctors(approvalStatus?: ApprovalStatus): Promise<Doctor[]> {
  const qs = approvalStatus ? `?approval_status=${approvalStatus}` : "";
  return apiRequest<Doctor[]>(`/admin/doctors${qs}`);
}

export function approveDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/approve`, { method: "POST" });
}

export function rejectDoctor(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/reject`, { method: "POST" });
}

export function makeAdmin(doctorId: string): Promise<Doctor> {
  return apiRequest<Doctor>(`/admin/doctors/${doctorId}/make-admin`, { method: "POST" });
}
