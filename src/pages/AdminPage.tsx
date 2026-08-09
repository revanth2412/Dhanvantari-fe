import { useCallback, useEffect, useState } from "react";
import { Check, ShieldCheck, UserCog, Users, X } from "lucide-react";
import {
  approveDoctor,
  listDoctors,
  makeAdmin,
  rejectDoctor,
} from "@/services/adminService";
import type { ApprovalStatus, Doctor } from "@/types/doctor";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useReveal } from "@/hooks/useReveal";

export function AdminPage() {
  const { doctor: me } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const revealRef = useReveal<HTMLDivElement>(".doc-row", [doctors]);

  const load = useCallback(() => {
    setDoctors(null);
    listDoctors(tab)
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [tab]);

  useEffect(load, [load]);

  async function run(
    doctorId: string,
    action: (id: string) => Promise<Doctor>,
    successTitle: string,
    // approve/reject move the doctor out of the current tab; make-admin doesn't.
    removeAfter = true,
  ) {
    setBusyId(doctorId);
    try {
      const updated = await action(doctorId);
      toast({ kind: "success", title: successTitle, message: updated.full_name });
      setDoctors((prev) =>
        removeAfter
          ? (prev?.filter((d) => d.id !== doctorId) ?? prev)
          : (prev?.map((d) => (d.id === doctorId ? updated : d)) ?? prev),
      );
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

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Doctor approvals</h1>
          <p className="page-head__sub">
            Review who can access the clinic workspace and clinical records.
          </p>
        </div>
        <Tabs<ApprovalStatus>
          value={tab}
          onChange={setTab}
          options={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      </div>

      <div className="ui-card" ref={revealRef} style={{ overflow: "hidden" }}>
        {doctors === null ? (
          <SkeletonRows rows={4} height={56} />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={tab === "pending" ? <ShieldCheck size={24} /> : <Users size={24} />}
            title={tab === "pending" ? "All caught up" : `No ${tab} doctors`}
            message={
              tab === "pending" ? "There are no doctors waiting for approval." : undefined
            }
          />
        ) : (
          doctors.map((doc) => (
            <div className="doc-row" key={doc.id}>
              <Avatar name={doc.full_name} size={42} />
              <div className="doc-row__meta">
                <div className="doc-row__name">
                  {doc.full_name}{" "}
                  {doc.role === "admin" && <Badge tone="accent">admin</Badge>}
                  {doc.id === me?.id && <Badge>you</Badge>}
                </div>
                <div className="doc-row__sub">
                  {[doc.email, doc.specialty, doc.registration_no]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="doc-row__actions">
                {tab !== "approved" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={busyId === doc.id}
                    disabled={busyId !== null && busyId !== doc.id}
                    onClick={() => void run(doc.id, approveDoctor, "Doctor approved")}
                  >
                    <Check size={14} /> Approve
                  </Button>
                )}
                {tab === "approved" && doc.role !== "admin" && (
                  <Button
                    size="sm"
                    loading={busyId === doc.id}
                    disabled={busyId !== null && busyId !== doc.id}
                    onClick={() =>
                      void run(doc.id, makeAdmin, "Promoted to admin", false)
                    }
                  >
                    <UserCog size={14} /> Make admin
                  </Button>
                )}
                {tab !== "rejected" && doc.id !== me?.id && (
                  <Button
                    variant="danger-soft"
                    size="sm"
                    loading={busyId === doc.id}
                    disabled={busyId !== null && busyId !== doc.id}
                    onClick={() => void run(doc.id, rejectDoctor, "Doctor rejected")}
                  >
                    <X size={14} /> Reject
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
