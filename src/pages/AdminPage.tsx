import { useState } from "react";
import { Check, Eye, RotateCcw, Search, ShieldCheck, UserCog, Users, X } from "lucide-react";
import {
  activateDoctor,
  approveDoctor,
  getAdminStats,
  getDoctorConsultations,
  getDoctorDetail,
  listAllConsultations,
  listDoctors,
  makeAdmin,
  rejectDoctor,
  revokeDoctor,
} from "@/services/adminService";
import type { ApprovalStatus, Doctor } from "@/types/doctor";
import type { DoctorAdmin } from "@/types/admin";
import { consultationStatusMeta, formatDateTime } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDataCache } from "@/hooks/useDataCache";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Drawer } from "@/components/ui/Modal";

type AccessFilter = "all" | "active" | "revoked";
type DoctorAction = "approve" | "reject" | "revoke" | "activate" | "make-admin";

export function AdminPage() {
  const { doctor: me } = useAuth();
  const toast = useToast();
  const cache = useDataCache();
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [access, setAccess] = useState<AccessFilter>("all");
  const [search, setSearch] = useState("");
  const [busyAction, setBusyAction] = useState<{ id: string; type: DoctorAction } | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const doctorKey = `admin:doctors:${tab}:${access}:${search.trim().toLowerCase()}`;
  const { data: stats } = useCachedQuery("admin:stats", getAdminStats, { ttlMs: 30_000 });
  const { data, loading, refresh, mutate } = useCachedQuery<DoctorAdmin[]>(doctorKey, () =>
    listDoctors({
      approval_status: tab,
      active: access === "all" ? undefined : access === "active",
      search: search.trim() || undefined,
    }),
  );
  const { data: consultations, loading: consultationsLoading } = useCachedQuery(
    "admin:consultations:recent",
    () => listAllConsultations({ limit: 8 }),
    { ttlMs: 30_000 },
  );
  const { data: selectedDoctor, loading: detailLoading } = useCachedQuery(
    `admin:doctor:${selectedDoctorId ?? "none"}`,
    () => getDoctorDetail(selectedDoctorId ?? ""),
    { enabled: selectedDoctorId !== null },
  );
  const { data: selectedConsultations, loading: detailConsultationsLoading } = useCachedQuery(
    `admin:doctor-consultations:${selectedDoctorId ?? "none"}`,
    () => getDoctorConsultations(selectedDoctorId ?? "", { limit: 20 }),
    { enabled: selectedDoctorId !== null },
  );
  const doctors = loading ? null : (data ?? []);

  async function run(
    doctorId: string,
    actionType: DoctorAction,
    action: (id: string) => Promise<Doctor>,
    successTitle: string,
    removeAfter = false,
  ) {
    setBusyAction({ id: doctorId, type: actionType });
    try {
      const updated = await action(doctorId);
      toast({ kind: "success", title: successTitle, message: updated.full_name });
      mutate(removeAfter ? (data ?? []).filter((doc) => doc.id !== doctorId) : (data ?? []).map((doc) => doc.id === doctorId ? { ...doc, ...updated } : doc));
      cache.invalidate("admin:");
      void refresh();
    } catch (err) {
      toast({ kind: "error", title: "Action failed", message: err instanceof Error ? err.message : undefined });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="page admin-page">
      <div className="page-head">
        <div>
          <h1>Administration</h1>
          <p className="page-head__sub">Oversee access and the clinical documentation pipeline.</p>
        </div>
        <Button size="sm" onClick={() => void refresh()}>Refresh</Button>
      </div>

      <section className="admin-stats" aria-label="System statistics">
        {[
          ["Doctors", stats?.doctors_total, `${stats?.doctors_active ?? 0} active`],
          ["Awaiting approval", stats?.doctors_pending, "Review access requests"],
          ["Patients", stats?.patients_total, "Across the workspace"],
          ["Consultations", stats?.consultations_total, `${stats?.consultations_finalized ?? 0} finalized`],
        ].map(([label, value, detail]) => (
          <div className="admin-stat ui-card" key={label as string}>
            <span>{label}</span><strong>{value ?? "—"}</strong><small>{detail}</small>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section__head">
          <div><h2>Doctor access</h2><p className="muted">Approve, revoke, or restore access to the workspace.</p></div>
          <div className="admin-filters">
            <div className="admin-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors" aria-label="Search doctors" /></div>
            <select value={access} onChange={(e) => setAccess(e.target.value as AccessFilter)} aria-label="Access status">
              <option value="all">All access</option><option value="active">Active</option><option value="revoked">Revoked</option>
            </select>
          </div>
        </div>
        <Tabs<ApprovalStatus> value={tab} onChange={setTab} options={[{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} />
        <div className="ui-card admin-doctors">
          {doctors === null ? <SkeletonRows rows={4} height={62} /> : doctors.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="No matching doctors" message="Try another approval, access, or search filter." />
          ) : doctors.map((doc) => {
            const isBusy = busyAction?.id === doc.id;
            const isLoading = (type: DoctorAction) => isBusy && busyAction?.type === type;
            return <div className="doc-row" key={doc.id}>
              <Avatar name={doc.full_name} size={42} />
              <div className="doc-row__meta"><div className="doc-row__name">{doc.full_name} {doc.role === "admin" && <Badge tone="accent">admin</Badge>} {doc.id === me?.id && <Badge>you</Badge>}</div><div className="doc-row__sub">{[doc.email, doc.phone, doc.specialty, doc.registration_no].filter(Boolean).join(" · ")}</div></div>
              <div className="doc-row__access"><Badge tone={doc.active ? "ok" : "danger"} dot>{doc.active ? "Active" : "Revoked"}</Badge><small>{doc.consultation_count} consultations</small></div>
              <div className="doc-row__actions">
                {tab === "pending" && <Button variant="primary" size="sm" loading={isLoading("approve")} disabled={busyAction !== null && !isLoading("approve")} onClick={() => void run(doc.id, "approve", approveDoctor, "Doctor approved", true)}><Check size={14} /> Approve</Button>}
                {tab !== "rejected" && doc.id !== me?.id && <Button variant="danger-soft" size="sm" loading={isLoading("reject")} disabled={busyAction !== null && !isLoading("reject")} onClick={() => void run(doc.id, "reject", rejectDoctor, "Doctor rejected", true)}><X size={14} /> Reject</Button>}
                {tab === "approved" && doc.id !== me?.id && (doc.active ? <Button size="sm" loading={isLoading("revoke")} disabled={busyAction !== null && !isLoading("revoke")} onClick={() => void run(doc.id, "revoke", revokeDoctor, "Access revoked")}><X size={14} /> Revoke</Button> : <Button size="sm" loading={isLoading("activate")} disabled={busyAction !== null && !isLoading("activate")} onClick={() => void run(doc.id, "activate", activateDoctor, "Access restored")}><RotateCcw size={14} /> Activate</Button>)}
                {tab === "approved" && doc.role !== "admin" && <Button size="sm" loading={isLoading("make-admin")} disabled={busyAction !== null && !isLoading("make-admin")} onClick={() => void run(doc.id, "make-admin", makeAdmin, "Promoted to admin")}><UserCog size={14} /> Make admin</Button>}
                <Button size="sm" onClick={() => setSelectedDoctorId(doc.id)}><Eye size={14} /> Activity</Button>
              </div>
            </div>;
          })}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section__head"><div><h2>Recent consultations</h2><p className="muted">Latest non-discarded activity across all doctors.</p></div><Badge tone="warn" dot>{stats?.consultations_failed ?? 0} failed</Badge></div>
        <div className="ui-card admin-consultations">
          {consultationsLoading ? <SkeletonRows rows={4} height={54} /> : consultations?.length ? consultations.map((item) => {
            const meta = consultationStatusMeta[item.status];
            return <div className="admin-consultation" key={item.id}><div><strong>{item.patient_name ?? "Unknown patient"}</strong><span>{formatDateTime(item.created_at)}</span></div><Badge tone={meta.tone} dot>{meta.label}</Badge></div>;
          }) : <EmptyState icon={<ShieldCheck size={24} />} title="No consultations yet" />}
        </div>
      </section>
      <Drawer open={selectedDoctorId !== null} onClose={() => setSelectedDoctorId(null)} title="Doctor activity">
        {detailLoading || detailConsultationsLoading ? <SkeletonRows rows={5} height={52} /> : selectedDoctor ? (
          <div className="admin-detail">
            <div className="admin-detail__identity"><Avatar name={selectedDoctor.full_name} size={44} /><div><strong>{selectedDoctor.full_name}</strong><span>{[selectedDoctor.email, selectedDoctor.address].filter(Boolean).join(" · ")}</span></div></div>
            <div className="admin-detail__stats">
              {[["Consultations", selectedDoctor.stats.total_consultations], ["Finalized", selectedDoctor.stats.finalized], ["Drafts", selectedDoctor.stats.draft_ready], ["In progress", selectedDoctor.stats.in_progress], ["Failed", selectedDoctor.stats.failed], ["Discarded", selectedDoctor.stats.discarded], ["Patients seen", selectedDoctor.stats.patients_seen]].map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <h3>Recent consultations</h3>
            {selectedConsultations?.length ? selectedConsultations.map((item) => { const meta = consultationStatusMeta[item.status]; return <div className="admin-consultation" key={item.id}><div><strong>{item.patient_name ?? "Unknown patient"}</strong><span>{formatDateTime(item.created_at)}</span></div><Badge tone={meta.tone} dot>{meta.label}</Badge></div>; }) : <p className="muted">No consultations found for this doctor.</p>}
          </div>
        ) : <EmptyState icon={<Users size={24} />} title="Doctor details unavailable" />}
      </Drawer>
    </main>
  );
}
