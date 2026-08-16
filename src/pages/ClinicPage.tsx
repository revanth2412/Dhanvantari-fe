import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Globe,
  MapPin,
  Mic,
  Pencil,
  Phone,
  PhoneOff,
  PlusCircle,
  Search,
  ShieldCheck,
  ShieldX,
  Stethoscope,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import {
  activateClinicMember,
  getClinicConsultations,
  getClinicMembers,
  getClinicStats,
  getMyClinic,
  getMyClinics,
  makeClinicMemberAdmin,
  revokeClinicMember,
  switchClinic,
  updateMyClinic,
} from "@/services/clinicService";
import type {
  ClinicConsultation,
  ClinicMember,
  ClinicMembership,
  ClinicStats,
  MyClinic,
} from "@/types/clinic";
import { searchPatients } from "@/services/patientService";
import type { Patient } from "@/types/patient";
import {
  ageFromDob,
  consultationStatusMeta,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDataCache } from "@/hooks/useDataCache";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Drawer, Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClinicSetup } from "@/components/clinic/ClinicSetup";

/* ---------------- edit clinic (clinic admin only) ---------------- */

function EditClinicDrawer({
  clinic,
  open,
  onClose,
  onSaved,
}: {
  clinic: MyClinic;
  open: boolean;
  onClose: () => void;
  onSaved: (next: MyClinic) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(clinic.name);
  const [city, setCity] = useState(clinic.city ?? "");
  const [phone, setPhone] = useState(clinic.phone ?? "");
  const [address, setAddress] = useState(clinic.address ?? "");
  const [regNo, setRegNo] = useState(clinic.registration_no ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const next = await updateMyClinic({
        name: name.trim(),
        city: city.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        registration_no: regNo.trim() || null,
      });
      toast({ kind: "success", title: "Clinic updated", message: next.name });
      onSaved(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the clinic");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit clinic"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            Save changes
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TextField
          label="Clinic name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <TextField
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <TextField
          label="Registration no."
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
        />
        <TextAreaField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
        />
        {error && <p className="ui-field__error">{error}</p>}
      </div>
    </Drawer>
  );
}

/* ---------------- page ---------------- */

export function ClinicPage() {
  const { doctor, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const cache = useDataCache();
  const [patientQuery, setPatientQuery] = useState("");
  const debouncedPatientQuery = useDebounce(patientQuery, 260);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);

  const clinicQuery = useCachedQuery<MyClinic | null>("clinic:me", getMyClinic);
  const clinic = clinicQuery.data ?? null;
  const isClinicAdmin = clinic?.role === "admin";

  const membershipsQuery = useCachedQuery<ClinicMembership[]>(
    "clinics:mine",
    getMyClinics,
  );
  const memberships = membershipsQuery.data ?? [];

  // Clinic-admin-only endpoints — requesting them as a regular doctor 403s.
  const membersQuery = useCachedQuery<ClinicMember[]>(
    "clinic:members",
    getClinicMembers,
    {
      enabled: isClinicAdmin,
    },
  );
  const statsQuery = useCachedQuery<ClinicStats>("clinic:stats", getClinicStats, {
    enabled: isClinicAdmin,
  });
  const consultationsQuery = useCachedQuery<ClinicConsultation[]>(
    "clinic:consultations",
    getClinicConsultations,
    { enabled: isClinicAdmin },
  );
  /* `GET /patients` is widened to the whole clinic for a clinic admin, so this
     is the clinic directory. The roster page narrows the same data down to the
     doctor's own patients — the full view belongs here. */
  const patientsQuery = useCachedQuery<Patient[]>(
    `patients:list:${debouncedPatientQuery.trim()}`,
    () => searchPatients(debouncedPatientQuery),
    { enabled: isClinicAdmin },
  );

  async function copyCode() {
    if (!clinic) return;
    try {
      await navigator.clipboard.writeText(clinic.join_code);
      haptic("success");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ kind: "error", title: "Could not copy the code" });
    }
  }

  async function handleSwitch(clinicId: string) {
    try {
      const next = await switchClinic(clinicId);
      toast({ kind: "success", title: "Switched clinic", message: next.name });
      setSwitcherOpen(false);
      cache.invalidate();
      await refreshProfile();
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not switch clinic",
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function memberAction(
    doctorId: string,
    action: (id: string) => Promise<ClinicMember>,
    title: string,
  ) {
    setBusyMember(doctorId);
    try {
      const updated = await action(doctorId);
      toast({ kind: "success", title, message: updated.full_name });
      cache.invalidate("clinic:");
      void membersQuery.refresh();
      void statsQuery.refresh();
    } catch (err) {
      toast({
        kind: "error",
        title: "Action failed",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyMember(null);
    }
  }

  if (clinicQuery.loading) {
    return (
      <main className="page">
        <div className="ui-card">
          <SkeletonRows rows={5} height={54} />
        </div>
      </main>
    );
  }

  if (!clinic) {
    return (
      <main className="page">
        <div className="page-head">
          <div>
            <h1>Clinic</h1>
            <p className="page-head__sub">You don&rsquo;t belong to a clinic yet.</p>
          </div>
        </div>
        <ClinicSetup
          onDone={() => {
            cache.invalidate();
            void refreshProfile();
          }}
        />
      </main>
    );
  }

  const members = membersQuery.data ?? [];
  const stats = statsQuery.data;
  const consultations = consultationsQuery.data ?? [];
  const otherClinics = memberships.filter((m) => m.clinic_id !== clinic.id);
  const clinicPatients = patientsQuery.data ?? [];

  /** doctor id → name, for attributing consultations to a colleague. */
  const doctorNames = new Map(members.map((m) => [m.doctor_id, m.full_name]));
  const doctorNameFor = (id: string | null) =>
    id ? (doctorNames.get(id) ?? (id === doctor?.id ? doctor.full_name : "—")) : "—";

  /** Per-patient activity, rolled up from the clinic's consultation log. */
  const patientActivity = new Map<
    string,
    { count: number; last: string | null; doctorIds: Set<string> }
  >();
  for (const item of consultations) {
    const entry = patientActivity.get(item.patient_id) ?? {
      count: 0,
      last: null,
      doctorIds: new Set<string>(),
    };
    entry.count += 1;
    // ISO-8601 sorts lexicographically, so a plain compare finds the latest.
    if (!entry.last || item.created_at > entry.last) entry.last = item.created_at;
    if (item.doctor_id) entry.doctorIds.add(item.doctor_id);
    patientActivity.set(item.patient_id, entry);
  }

  return (
    <main className="page page--wide">
      <section className="clinic-hero">
        <span className="clinic-hero__icon">
          <Building2 size={24} />
        </span>
        <div className="clinic-hero__meta">
          <h1>{clinic.name}</h1>
          <p>
            {[clinic.city, clinic.registration_no && `Reg. ${clinic.registration_no}`]
              .filter(Boolean)
              .join(" · ") || "Your clinic workspace"}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Badge tone={isClinicAdmin ? "accent" : "info"}>
              {isClinicAdmin ? "You're the clinic admin" : "Member"}
            </Badge>
            {!clinic.active && <Badge tone="danger">Suspended</Badge>}
          </div>
        </div>

        <div className="clinic-hero__actions">
          {otherClinics.length > 0 && (
            <Button
              onClick={() => setSwitcherOpen(true)}
              style={{
                background: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.22)",
                color: "#fff",
              }}
            >
              <ChevronsUpDown size={15} /> Switch clinic
            </Button>
          )}
          {/* A doctor may belong to several clinics — let them add another. */}
          <Button
            onClick={() => setAddOpen(true)}
            style={{
              background: "rgba(255,255,255,0.1)",
              borderColor: "rgba(255,255,255,0.22)",
              color: "#fff",
            }}
          >
            <PlusCircle size={15} /> Join another
          </Button>
          <div className="joincode">
            <div>
              <div className="joincode__label">Invite code</div>
              <div className="joincode__value">{clinic.join_code}</div>
            </div>
            <Button
              size="sm"
              onClick={() => void copyCode()}
              style={{
                background: "rgba(255,255,255,0.12)",
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </section>

      {/* Clinic-wide activity — admins only (the API 403s otherwise). */}
      {isClinicAdmin && (
        <section className="stat-rail">
          {[
            ["Doctors", stats?.doctors_total, `${stats?.doctors_active ?? 0} active`],
            ["Patients", stats?.patients_total, "In this clinic"],
            [
              "Consultations",
              stats?.consultations_total,
              `${stats?.consultations_last_7_days ?? 0} in last 7 days`,
            ],
            [
              "Finalized",
              stats?.consultations_finalized,
              `${stats?.consultations_draft_ready ?? 0} awaiting review`,
            ],
          ].map(([label, value, detail]) => (
            <div className="ui-card stat-card" key={label as string}>
              <span className="stat-card__icon stat-card__icon--jade">
                <Activity size={20} />
              </span>
              <div>
                <div className="stat-card__value">{value ?? "—"}</div>
                <div className="stat-card__label">
                  {label}
                  <div className="faint" style={{ fontSize: "0.72rem" }}>
                    {detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="pt-cols">
        <div className="ui-card ui-card--pad">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <h2 style={{ fontSize: "0.98rem" }}>Details</h2>
            {isClinicAdmin && (
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil size={14} /> Edit
              </Button>
            )}
          </div>
          <div className="pt-facts">
            <div className="pt-fact">
              <span className="pt-fact__k">
                <Phone size={13} /> Phone
              </span>
              <span className="pt-fact__v">{clinic.phone ?? "—"}</span>
            </div>
            <div className="pt-fact">
              <span className="pt-fact__k">
                <MapPin size={13} /> Address
              </span>
              <span className="pt-fact__v">{clinic.address ?? "—"}</span>
            </div>
            <div className="pt-fact">
              <span className="pt-fact__k">City</span>
              <span className="pt-fact__v">{clinic.city ?? "—"}</span>
            </div>
            <div className="pt-fact">
              <span className="pt-fact__k">Created</span>
              <span className="pt-fact__v">{formatDate(clinic.created_at)}</span>
            </div>
          </div>
          {!isClinicAdmin && (
            <p className="ui-field__hint" style={{ marginTop: 12 }}>
              You see the patients and consultations you create. A clinic admin sees
              everything in the clinic.
            </p>
          )}
        </div>

        <div className="ui-card">
          <div className="panel-head" style={{ paddingBottom: 12 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} style={{ color: "var(--primary)" }} /> Doctors
              {members.length > 0 && <Badge tone="ok">{members.length}</Badge>}
            </h2>
            <Button size="sm" variant="primary" onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} /> Add doctor
            </Button>
          </div>

          {!isClinicAdmin ? (
            <EmptyState
              icon={<ShieldCheck size={22} />}
              title="Only clinic admins see the member list"
              message="Share the invite code above to bring a colleague into this clinic."
            />
          ) : membersQuery.loading ? (
            <SkeletonRows rows={3} height={52} />
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              title="No colleagues yet"
              message="Share your invite code and they'll appear here once they join."
            />
          ) : (
            members.map((member) => {
              const isSelf = member.doctor_id === doctor?.id;
              const busy = busyMember === member.doctor_id;
              return (
                <div className="member-row" key={member.doctor_id}>
                  <Avatar name={member.full_name} size={38} />
                  <div className="member-row__meta">
                    <div className="member-row__name">
                      {member.full_name}
                      {isSelf && (
                        <span style={{ marginLeft: 8 }}>
                          <Badge>you</Badge>
                        </span>
                      )}
                    </div>
                    <div className="member-row__sub">
                      {[member.specialty, member.email].filter(Boolean).join(" · ") ||
                        "—"}
                      {" · joined "}
                      {formatDate(member.joined_at)}
                    </div>
                  </div>
                  <div className="member-row__tags">
                    {member.role === "admin" && <Badge tone="accent">clinic admin</Badge>}
                    {!member.doctor_active ? (
                      <Badge tone="danger" dot>
                        account revoked
                      </Badge>
                    ) : (
                      <Badge tone={member.active ? "ok" : "danger"} dot>
                        {member.active ? "active" : "removed"}
                      </Badge>
                    )}
                  </div>
                  {!isSelf && (
                    <div className="member-row__actions">
                      {member.role !== "admin" && member.active && (
                        <Button
                          size="sm"
                          loading={busy}
                          disabled={busyMember !== null && !busy}
                          onClick={() =>
                            void memberAction(
                              member.doctor_id,
                              makeClinicMemberAdmin,
                              "Promoted to clinic admin",
                            )
                          }
                        >
                          <UserCog size={13} /> Make admin
                        </Button>
                      )}
                      {member.active ? (
                        <Button
                          size="sm"
                          variant="danger-soft"
                          loading={busy}
                          disabled={busyMember !== null && !busy}
                          onClick={() =>
                            void memberAction(
                              member.doctor_id,
                              revokeClinicMember,
                              "Removed from clinic",
                            )
                          }
                        >
                          <ShieldX size={13} /> Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          loading={busy}
                          disabled={busyMember !== null && !busy}
                          onClick={() =>
                            void memberAction(
                              member.doctor_id,
                              activateClinicMember,
                              "Access restored",
                            )
                          }
                        >
                          <Check size={13} /> Restore
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---------- every patient in the clinic (clinic admin only) ---------- */}
      {isClinicAdmin && (
        <section style={{ marginTop: 16 }}>
          <div className="panel-head" style={{ padding: "0 0 12px" }}>
            <h2 style={{ fontSize: "1rem" }}>Clinic patients</h2>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Everyone registered at {clinic.name}
            </span>
          </div>

          <div className="ui-card" style={{ overflow: "hidden" }}>
            <div className="clinic-pt-search">
              <Search size={15} />
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="Search clinic patients by name or phone…"
                aria-label="Search clinic patients"
              />
              {patientQuery && (
                <button type="button" onClick={() => setPatientQuery("")}>
                  ×
                </button>
              )}
            </div>

            {patientsQuery.loading ? (
              <SkeletonRows rows={5} height={62} />
            ) : clinicPatients.length === 0 ? (
              <EmptyState
                icon={<Users size={22} />}
                title={patientQuery ? "No patients match" : "No patients registered yet"}
                message={
                  patientQuery
                    ? "Try a different name or phone number."
                    : "They'll appear here as your doctors register them."
                }
              />
            ) : (
              clinicPatients.map((patient) => {
                const activity = patientActivity.get(patient.id);
                const seenBy = [...(activity?.doctorIds ?? [])].map(doctorNameFor);
                return (
                  <div className="clinic-pt-row" key={patient.id}>
                    <Avatar name={patient.full_name} size={38} />

                    <div className="clinic-pt-main">
                      <div className="clinic-pt-name">
                        {patient.full_name}
                        {patient.do_not_call && (
                          <span className="clinic-pt-flag" title="Do not call">
                            <PhoneOff size={11} /> Do not call
                          </span>
                        )}
                      </div>
                      <div className="clinic-pt-facts">
                        <span>
                          {[ageFromDob(patient.dob), patient.gender]
                            .filter(Boolean)
                            .join(" · ") || "Age not recorded"}
                        </span>
                        <span>
                          <Phone size={11} /> {patient.phone ?? "No phone"}
                        </span>
                        <span>
                          <Globe size={11} /> {patient.language_pref ?? "English"}
                        </span>
                        <span>
                          <CalendarClock size={11} /> Registered{" "}
                          {formatDate(patient.created_at)}
                        </span>
                      </div>
                      <div className="clinic-pt-facts clinic-pt-facts--care">
                        <span>
                          <Activity size={11} /> {activity?.count ?? 0} consultation
                          {activity?.count === 1 ? "" : "s"}
                        </span>
                        {activity?.last && (
                          <span>Last visit {formatDate(activity.last)}</span>
                        )}
                        {seenBy.length > 0 && (
                          <span>
                            <Stethoscope size={11} /> Seen by {seenBy.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="clinic-pt-actions">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/consultations/new?patient_id=${patient.id}`)
                        }
                        title="Start a consultation with this patient"
                      >
                        <Mic size={14} /> Consult
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        iconOnly
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        aria-label={`Open ${patient.full_name}'s chart`}
                        title="Open the full chart"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="muted" style={{ fontSize: "0.76rem", marginTop: 8 }}>
            The directory returns the 50 most recently registered patients — search to
            reach older records.
          </p>
        </section>
      )}

      {isClinicAdmin && (
        <section style={{ marginTop: 16 }}>
          <div className="panel-head" style={{ padding: "0 0 12px" }}>
            <h2 style={{ fontSize: "1rem" }}>Clinic consultations</h2>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Every doctor in {clinic.name}
            </span>
          </div>
          <div className="ui-card" style={{ overflow: "hidden" }}>
            {consultationsQuery.loading ? (
              <SkeletonRows rows={4} height={52} />
            ) : consultations.length === 0 ? (
              <EmptyState
                icon={<Activity size={22} />}
                title="No consultations yet"
                message="They'll appear here as your doctors record them."
              />
            ) : (
              consultations.slice(0, 25).map((item) => {
                const meta = consultationStatusMeta[item.status];
                return (
                  <div className="member-row" key={item.id}>
                    <Avatar name={item.patient_name} size={34} />
                    <div className="member-row__meta">
                      <div className="member-row__name">
                        {item.patient_name ?? "Patient"}
                      </div>
                      <div className="member-row__sub">
                        {formatDateTime(item.created_at)} · conducted by{" "}
                        {doctorNameFor(item.doctor_id)}
                      </div>
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
      )}

      {isClinicAdmin && (
        <EditClinicDrawer
          clinic={clinic}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(next) => clinicQuery.mutate(next)}
        />
      )}

      {/* Join or start an additional clinic. Both routes switch the active
          clinic to the new one, so the whole cache is dropped afterwards. */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add another clinic"
        maxWidth={600}
      >
        <p style={{ color: "var(--ink-2)", fontSize: "0.9rem", marginBottom: 14 }}>
          You can practise at more than one clinic. Adding one switches you to it — use{" "}
          <strong>Switch clinic</strong> to move back at any time.
        </p>
        <ClinicSetup
          bare
          onDone={() => {
            setAddOpen(false);
            cache.invalidate();
            void refreshProfile();
          }}
        />
      </Modal>

      <Modal
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        title="Switch clinic"
        footer={
          <Button
            variant="soft"
            onClick={() => {
              setSwitcherOpen(false);
              setAddOpen(true);
            }}
          >
            <PlusCircle size={15} /> Join another clinic
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {memberships.map((m) => {
            const usable = m.active && m.clinic_active;
            return (
              <button
                key={m.clinic_id}
                type="button"
                className={`pt-pick ${m.is_current ? "pt-pick--selected" : ""}`}
                disabled={!usable || m.is_current}
                onClick={() => void handleSwitch(m.clinic_id)}
              >
                <span className="clinic-row__icon">
                  <Building2 size={17} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600 }}>{m.name}</span>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {m.city ?? "—"}
                    {!m.clinic_active
                      ? " · clinic suspended"
                      : !m.active
                        ? " · you were removed"
                        : ""}
                  </span>
                </span>
                {m.role === "admin" && <Badge tone="accent">admin</Badge>}
                {m.is_current && <Badge tone="ok">current</Badge>}
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add a doctor to this clinic"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => void copyCode()}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy code"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--ink-2)", fontSize: "0.92rem" }}>
          Doctors join themselves — send them this invite code and they&rsquo;ll enter it
          when they sign up, or from their own Clinic page. They can start working
          immediately; no approval step.
        </p>
        <div
          className="joincode"
          style={{
            marginTop: 14,
            background: "var(--primary-soft)",
            borderColor: "var(--green-300)",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="joincode__label" style={{ color: "var(--muted)" }}>
              Invite code
            </div>
            <div className="joincode__value" style={{ color: "var(--primary-strong)" }}>
              {clinic.join_code}
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
