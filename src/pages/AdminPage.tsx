import { useState } from "react";
import {
  Activity,
  Building2,
  Eye,
  Plus,
  RotateCcw,
  Search,
  ShieldX,
  UserCog,
  Users,
} from "lucide-react";
import {
  activateClinic,
  activateDoctor,
  assignDoctorClinic,
  createClinicAsAdmin,
  getAdminStats,
  getClinicConsultations,
  getClinicDoctors,
  getClinicStats,
  getDoctorConsultations,
  getDoctorDetail,
  listAllConsultations,
  listClinics,
  listDoctors,
  makeAdmin,
  revokeClinic,
  revokeDoctor,
} from "@/services/adminService";
import type { DoctorAdmin } from "@/types/admin";
import type { ClinicAdmin } from "@/types/clinic";
import { consultationStatusMeta, formatDateTime } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDataCache } from "@/hooks/useDataCache";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Drawer, Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Field";

type AccessFilter = "all" | "active" | "revoked";

/**
 * Platform administration.
 *
 * Signup is auto-approved, so this is not an approval queue — it's access
 * control at two independent levels:
 *   - **clinic**: revoking one stops everyone working in it, but its doctors
 *     can still use other clinics they belong to;
 *   - **doctor**: revoking one blocks that doctor in every clinic.
 * Patient PII is never shown here (DPDP) — consultations are opaque ids.
 */
export function AdminPage() {
  const { doctor: me } = useAuth();
  const toast = useToast();
  const cache = useDataCache();

  const [access, setAccess] = useState<AccessFilter>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 280);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [clinicModalOpen, setClinicModalOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newClinicCity, setNewClinicCity] = useState("");
  const [creatingClinic, setCreatingClinic] = useState(false);

  const { data: stats, refresh: refreshStats } = useCachedQuery(
    "admin:stats",
    getAdminStats,
    { ttlMs: 30_000 },
  );
  const {
    data: clinics,
    loading: clinicsLoading,
    refresh: refreshClinics,
  } = useCachedQuery<ClinicAdmin[]>("admin:clinics", () => listClinics());

  const doctorKey = `admin:doctors:${access}:${debouncedSearch.trim().toLowerCase()}`;
  const {
    data: doctorsData,
    loading: doctorsLoading,
    refresh: refreshDoctors,
  } = useCachedQuery<DoctorAdmin[]>(doctorKey, () =>
    listDoctors({
      active: access === "all" ? undefined : access === "active",
      search: debouncedSearch.trim() || undefined,
    }),
  );

  // Drill-downs
  const { data: doctorDetail, loading: detailLoading } = useCachedQuery(
    `admin:doctor:${selectedDoctorId ?? "none"}`,
    () => getDoctorDetail(selectedDoctorId ?? ""),
    { enabled: selectedDoctorId !== null },
  );
  const { data: doctorConsultations } = useCachedQuery(
    `admin:doctor-consultations:${selectedDoctorId ?? "none"}`,
    () => getDoctorConsultations(selectedDoctorId ?? "", { limit: 20 }),
    { enabled: selectedDoctorId !== null },
  );
  const { data: clinicStats, loading: clinicStatsLoading } = useCachedQuery(
    `admin:clinic-stats:${selectedClinicId ?? "none"}`,
    () => getClinicStats(selectedClinicId ?? ""),
    { enabled: selectedClinicId !== null },
  );
  const { data: clinicDoctors } = useCachedQuery(
    `admin:clinic-doctors:${selectedClinicId ?? "none"}`,
    () => getClinicDoctors(selectedClinicId ?? ""),
    { enabled: selectedClinicId !== null },
  );
  const { data: clinicConsultations } = useCachedQuery(
    `admin:clinic-consultations:${selectedClinicId ?? "none"}`,
    () => getClinicConsultations(selectedClinicId ?? "", { limit: 15 }),
    { enabled: selectedClinicId !== null },
  );
  const { data: recentConsultations, loading: recentLoading } = useCachedQuery(
    "admin:consultations:recent",
    () => listAllConsultations({ limit: 8 }),
    { ttlMs: 30_000 },
  );

  const doctors = doctorsLoading ? null : (doctorsData ?? []);
  const selectedClinic = clinics?.find((c) => c.id === selectedClinicId) ?? null;

  function refreshAll() {
    cache.invalidate("admin:");
    void refreshStats();
    void refreshClinics();
    void refreshDoctors();
  }

  async function run<T>(id: string, action: () => Promise<T>, title: string) {
    setBusyId(id);
    try {
      await action();
      toast({ kind: "success", title });
      refreshAll();
    } catch (err) {
      toast({
        kind: "error",
        title: "Action failed",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateClinic() {
    setCreatingClinic(true);
    try {
      const clinic = await createClinicAsAdmin({
        name: newClinicName.trim(),
        city: newClinicCity.trim() || null,
      });
      toast({ kind: "success", title: "Clinic created", message: clinic.name });
      setClinicModalOpen(false);
      setNewClinicName("");
      setNewClinicCity("");
      refreshAll();
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not create the clinic",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCreatingClinic(false);
    }
  }

  return (
    <main className="page page--wide admin-page">
      <div className="page-head">
        <div>
          <h1>Administration</h1>
          <p className="page-head__sub">
            Access control across clinics and doctors. Signup needs no approval — revoke
            here when access must stop.
          </p>
        </div>
        <Button size="sm" onClick={refreshAll}>
          <RotateCcw size={14} /> Refresh
        </Button>
      </div>

      <section className="admin-stats" aria-label="System statistics">
        {[
          ["Clinics", stats?.clinics_total, `${stats?.clinics_active ?? 0} active`],
          [
            "Doctors",
            stats?.doctors_total,
            `${stats?.doctors_active ?? 0} active · ${stats?.doctors_unassigned ?? 0} unassigned`,
          ],
          ["Patients", stats?.patients_total, "Across all clinics"],
          [
            "Consultations",
            stats?.consultations_total,
            `${stats?.consultations_last_7_days ?? 0} in last 7 days`,
          ],
        ].map(([label, value, detail]) => (
          <div className="admin-stat ui-card" key={label as string}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </section>

      {/* ---------------- Clinics ---------------- */}
      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Clinics</h2>
            <p className="muted">
              Revoking a clinic stops all work inside it; its doctors can still use other
              clinics they belong to.
            </p>
          </div>
          <Button size="sm" variant="primary" onClick={() => setClinicModalOpen(true)}>
            <Plus size={14} /> New clinic
          </Button>
        </div>
        <div className="ui-card admin-clinics">
          {clinicsLoading ? (
            <SkeletonRows rows={3} height={58} />
          ) : !clinics?.length ? (
            <EmptyState
              icon={<Building2 size={24} />}
              title="No clinics yet"
              message="Doctors create their own during onboarding, or add one here."
            />
          ) : (
            clinics.map((clinic) => (
              <div className="clinic-row" key={clinic.id}>
                <span className="clinic-row__icon">
                  <Building2 size={18} />
                </span>
                <div className="clinic-row__meta">
                  <div className="clinic-row__name">
                    {clinic.name} {!clinic.active && <Badge tone="danger">revoked</Badge>}
                  </div>
                  <div className="clinic-row__sub">
                    {[clinic.city, clinic.phone].filter(Boolean).join(" · ") || "—"}
                    {" · code "}
                    <span className="mono">{clinic.join_code}</span>
                  </div>
                </div>
                <div className="clinic-row__counts">
                  <span>
                    <strong>{clinic.doctor_count}</strong> doctors
                  </span>
                  <span>
                    <strong>{clinic.patient_count}</strong> patients
                  </span>
                  <span>
                    <strong>{clinic.consultation_count}</strong> consultations
                  </span>
                </div>
                <div className="doc-row__actions">
                  <Button size="sm" onClick={() => setSelectedClinicId(clinic.id)}>
                    <Eye size={14} /> Details
                  </Button>
                  {clinic.active ? (
                    <Button
                      size="sm"
                      variant="danger-soft"
                      loading={busyId === clinic.id}
                      disabled={busyId !== null && busyId !== clinic.id}
                      onClick={() =>
                        void run(
                          clinic.id,
                          () => revokeClinic(clinic.id),
                          `${clinic.name} revoked`,
                        )
                      }
                    >
                      <ShieldX size={14} /> Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      loading={busyId === clinic.id}
                      disabled={busyId !== null && busyId !== clinic.id}
                      onClick={() =>
                        void run(
                          clinic.id,
                          () => activateClinic(clinic.id),
                          `${clinic.name} reactivated`,
                        )
                      }
                    >
                      <RotateCcw size={14} /> Activate
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ---------------- Doctors ---------------- */}
      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Doctors</h2>
            <p className="muted">
              Revoking a doctor blocks them in every clinic. Only an admin can restore it
              — there is no self-service request.
            </p>
          </div>
          <div className="admin-filters">
            <div className="admin-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors"
                aria-label="Search doctors"
              />
            </div>
            <Tabs<AccessFilter>
              value={access}
              onChange={setAccess}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "revoked", label: "Revoked" },
              ]}
            />
          </div>
        </div>
        <div className="ui-card admin-doctors">
          {doctors === null ? (
            <SkeletonRows rows={4} height={62} />
          ) : doctors.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="No matching doctors"
              message="Try another access filter or search term."
            />
          ) : (
            doctors.map((doc) => {
              const busy = busyId === doc.id;
              return (
                <div className="doc-row" key={doc.id}>
                  <Avatar name={doc.full_name} size={42} />
                  <div className="doc-row__meta">
                    <div className="doc-row__name">
                      {doc.full_name}{" "}
                      {doc.role === "admin" && (
                        <Badge tone="accent">platform admin</Badge>
                      )}{" "}
                      {doc.id === me?.id && <Badge>you</Badge>}
                    </div>
                    <div className="doc-row__sub">
                      {[doc.email, doc.phone, doc.specialty].filter(Boolean).join(" · ")}
                      {doc.clinic_name ? ` · ${doc.clinic_name}` : " · no clinic"}
                    </div>
                  </div>
                  <div className="doc-row__access">
                    <Badge tone={doc.active ? "ok" : "danger"} dot>
                      {doc.active ? "Active" : "Revoked"}
                    </Badge>
                    <small>{doc.consultation_count} consultations</small>
                    <select
                      className="doc-row__clinic"
                      value={doc.clinic_id ?? ""}
                      disabled={busy}
                      aria-label={`Clinic for ${doc.full_name}`}
                      onChange={(e) =>
                        void run(
                          doc.id,
                          () => assignDoctorClinic(doc.id, e.target.value || null),
                          "Clinic updated",
                        )
                      }
                    >
                      <option value="">No clinic</option>
                      {(clinics ?? []).map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="doc-row__actions">
                    <Button size="sm" onClick={() => setSelectedDoctorId(doc.id)}>
                      <Eye size={14} /> Activity
                    </Button>
                    {doc.role !== "admin" && (
                      <Button
                        size="sm"
                        loading={busy}
                        disabled={busyId !== null && !busy}
                        onClick={() =>
                          void run(
                            doc.id,
                            () => makeAdmin(doc.id),
                            "Promoted to platform admin",
                          )
                        }
                      >
                        <UserCog size={14} /> Make admin
                      </Button>
                    )}
                    {doc.id !== me?.id &&
                      (doc.active ? (
                        <Button
                          size="sm"
                          variant="danger-soft"
                          loading={busy}
                          disabled={busyId !== null && !busy}
                          onClick={() =>
                            void run(
                              doc.id,
                              () => revokeDoctor(doc.id),
                              "Access revoked everywhere",
                            )
                          }
                        >
                          <ShieldX size={14} /> Revoke
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          loading={busy}
                          disabled={busyId !== null && !busy}
                          onClick={() =>
                            void run(
                              doc.id,
                              () => activateDoctor(doc.id),
                              "Access restored",
                            )
                          }
                        >
                          <RotateCcw size={14} /> Activate
                        </Button>
                      ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ---------------- Recent activity ---------------- */}
      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Recent consultations</h2>
            <p className="muted">
              Operational metadata only — patient details are never shown here.
            </p>
          </div>
        </div>
        <div className="ui-card admin-consultations">
          {recentLoading ? (
            <SkeletonRows rows={4} height={54} />
          ) : !recentConsultations?.length ? (
            <EmptyState icon={<Activity size={24} />} title="No consultations yet" />
          ) : (
            recentConsultations.map((item) => {
              const meta = consultationStatusMeta[item.status];
              return (
                <div className="admin-consultation" key={item.id}>
                  <div>
                    <strong className="mono">
                      Patient {item.patient_id.slice(0, 8)}
                    </strong>
                    <span>{formatDateTime(item.created_at)}</span>
                  </div>
                  <Badge tone={meta.tone} dot>
                    {meta.label}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ---------------- Clinic drill-down ---------------- */}
      <Drawer
        open={selectedClinicId !== null}
        onClose={() => setSelectedClinicId(null)}
        title={selectedClinic?.name ?? "Clinic"}
      >
        {clinicStatsLoading ? (
          <SkeletonRows rows={5} height={52} />
        ) : (
          <div className="admin-detail">
            <div className="admin-detail__stats">
              {[
                ["Doctors", clinicStats?.doctors_total],
                ["Active doctors", clinicStats?.doctors_active],
                ["Clinic admins", clinicStats?.admins],
                ["Patients", clinicStats?.patients_total],
                ["Consultations", clinicStats?.consultations_total],
                ["Finalized", clinicStats?.consultations_finalized],
                ["Drafts", clinicStats?.consultations_draft_ready],
                ["Last 30 days", clinicStats?.consultations_last_30_days],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span>{label}</span>
                  <strong>{value ?? "—"}</strong>
                </div>
              ))}
            </div>

            <h3>Doctors in this clinic</h3>
            {clinicDoctors?.length ? (
              clinicDoctors.map((m) => (
                <div className="member-row" key={m.doctor_id}>
                  <Avatar name={m.full_name} size={34} />
                  <div className="member-row__meta">
                    <div className="member-row__name">{m.full_name}</div>
                    <div className="member-row__sub">{m.email ?? "—"}</div>
                  </div>
                  <div className="member-row__tags">
                    {m.role === "admin" && <Badge tone="accent">clinic admin</Badge>}
                    <Badge tone={m.active && m.doctor_active ? "ok" : "danger"} dot>
                      {!m.doctor_active
                        ? "account revoked"
                        : m.active
                          ? "active"
                          : "removed"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No doctors in this clinic.</p>
            )}

            <h3>Recent consultations</h3>
            {clinicConsultations?.length ? (
              clinicConsultations.map((item) => {
                const meta = consultationStatusMeta[item.status];
                return (
                  <div className="admin-consultation" key={item.id}>
                    <div>
                      <strong className="mono">
                        Patient {item.patient_id.slice(0, 8)}
                      </strong>
                      <span>{formatDateTime(item.created_at)}</span>
                    </div>
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="muted">No consultations in this clinic yet.</p>
            )}
          </div>
        )}
      </Drawer>

      {/* ---------------- Doctor drill-down ---------------- */}
      <Drawer
        open={selectedDoctorId !== null}
        onClose={() => setSelectedDoctorId(null)}
        title="Doctor activity"
      >
        {detailLoading ? (
          <SkeletonRows rows={5} height={52} />
        ) : doctorDetail ? (
          <div className="admin-detail">
            <div className="admin-detail__identity">
              <Avatar name={doctorDetail.full_name} size={44} />
              <div>
                <strong>{doctorDetail.full_name}</strong>
                <span>
                  {[doctorDetail.email, doctorDetail.clinic_name ?? "no clinic"]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </div>
            <div className="admin-detail__stats">
              {[
                ["Consultations", doctorDetail.stats.total_consultations],
                ["Finalized", doctorDetail.stats.finalized],
                ["Drafts", doctorDetail.stats.draft_ready],
                ["In progress", doctorDetail.stats.in_progress],
                ["Failed", doctorDetail.stats.failed],
                ["Discarded", doctorDetail.stats.discarded],
                ["Patients seen", doctorDetail.stats.patients_seen],
                ["Last 30 days", doctorDetail.stats.consultations_last_30_days],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <h3>Recent consultations</h3>
            {doctorConsultations?.length ? (
              doctorConsultations.map((item) => {
                const meta = consultationStatusMeta[item.status];
                return (
                  <div className="admin-consultation" key={item.id}>
                    <div>
                      <strong className="mono">
                        Patient {item.patient_id.slice(0, 8)}
                      </strong>
                      <span>{formatDateTime(item.created_at)}</span>
                    </div>
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="muted">No consultations found for this doctor.</p>
            )}
          </div>
        ) : (
          <EmptyState icon={<Users size={24} />} title="Doctor details unavailable" />
        )}
      </Drawer>

      <Modal
        open={clinicModalOpen}
        onClose={() => setClinicModalOpen(false)}
        title="Create a clinic"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setClinicModalOpen(false)}
              disabled={creatingClinic}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creatingClinic}
              disabled={newClinicName.trim().length < 2}
              onClick={() => void handleCreateClinic()}
            >
              Create clinic
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextField
            label="Clinic name"
            required
            value={newClinicName}
            onChange={(e) => setNewClinicName(e.target.value)}
            placeholder="e.g. Sanjeevani Clinic"
            autoFocus
          />
          <TextField
            label="City"
            value={newClinicCity}
            onChange={(e) => setNewClinicCity(e.target.value)}
          />
          <p className="ui-field__hint">
            A join code is generated automatically — share it so doctors can join
            themselves, or assign them from the list above.
          </p>
        </div>
      </Modal>
    </main>
  );
}
