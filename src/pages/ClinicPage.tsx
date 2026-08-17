import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  Activity,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Copy,
  Globe,
  MapPin,
  Mic,
  Pencil,
  Phone,
  PhoneOff,
  Plus,
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
import { listPatients } from "@/services/patientService";
import type { Page } from "@/lib/apiClient";
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

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

type Tab = "doctors" | "patients" | "activity";

export function ClinicPage() {
  const { doctor, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const cache = useDataCache();
  const rootRef = useRef<HTMLElement | null>(null);

  const [tab, setTab] = useState<Tab>("doctors");
  const [patientQuery, setPatientQuery] = useState("");
  const debouncedPatientQuery = useDebounce(patientQuery, 260);
  const [patientLimit, setPatientLimit] = useState(50);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

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
    { enabled: isClinicAdmin },
  );
  const statsQuery = useCachedQuery<ClinicStats>("clinic:stats", getClinicStats, {
    enabled: isClinicAdmin,
  });
  const consultationsQuery = useCachedQuery<ClinicConsultation[]>(
    "clinic:consultations",
    getClinicConsultations,
    { enabled: isClinicAdmin },
  );
  const patientsQuery = useCachedQuery<Page<Patient>>(
    `patients:clinic:${debouncedPatientQuery.trim()}:${patientLimit}`,
    () => listPatients({ search: debouncedPatientQuery, limit: patientLimit }),
    { enabled: isClinicAdmin && tab === "patients" },
  );

  /* Transform-only entrance: never gates whether content is visible. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-lift]", {
        y: 20,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
      });
      gsap.from("[data-card]", {
        y: 16,
        duration: 0.5,
        stagger: 0.05,
        delay: 0.1,
        ease: "power3.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

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
    haptic("bubble");
    setSwitching(clinicId);
    try {
      const next = await switchClinic(clinicId);
      toast({ kind: "success", title: "Now working at", message: next.name });
      // Every scoped list belongs to the old clinic — drop the lot.
      cache.invalidate();
      await refreshProfile();
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not switch clinic",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSwitching(null);
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
  const clinicPatients = patientsQuery.data?.items ?? [];
  const clinicPatientTotal = patientsQuery.data?.total ?? 0;

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

  const TABS: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "doctors", label: "Doctors", count: members.length },
    { id: "patients", label: "Patients", count: stats?.patients_total },
    { id: "activity", label: "Activity", count: stats?.consultations_total },
  ];

  return (
    <main className="page page--wide cl" ref={rootRef}>
      {/* ---------------- clinic switcher ----------------
          A doctor can practise at several clinics; switching is the first thing
          on the page rather than something buried in a dialog. */}
      <section className="cl-switch" aria-label="Your clinics" data-lift>
        <div className="cl-switch__rail">
          {memberships.map((m) => {
            const usable = m.active && m.clinic_active;
            const problem = !m.clinic_active
              ? "Clinic suspended"
              : !m.active
                ? "You were removed"
                : null;
            return (
              <button
                key={m.clinic_id}
                type="button"
                className={`cl-chip ${m.is_current ? "cl-chip--on" : ""} ${
                  problem ? "cl-chip--blocked" : ""
                }`}
                disabled={!usable || m.is_current || switching !== null}
                aria-current={m.is_current ? "true" : undefined}
                onClick={() => void handleSwitch(m.clinic_id)}
                title={
                  problem ?? (m.is_current ? "Current clinic" : `Switch to ${m.name}`)
                }
              >
                <span className="cl-chip__icon">
                  <Building2 size={15} />
                </span>
                <span className="cl-chip__text">
                  <b>{m.name}</b>
                  <small>{problem ?? m.city ?? "—"}</small>
                </span>
                {m.role === "admin" && <span className="cl-chip__role">admin</span>}
                {switching === m.clinic_id && <span className="cl-chip__spin" />}
              </button>
            );
          })}

          <button
            type="button"
            className="cl-chip cl-chip--add"
            onClick={() => setAddOpen(true)}
          >
            <span className="cl-chip__icon">
              <Plus size={15} />
            </span>
            <span className="cl-chip__text">
              <b>Join or create</b>
              <small>Add another clinic</small>
            </span>
          </button>
        </div>
      </section>

      {/* ---------------- masthead ---------------- */}
      <header className="cl-top" data-lift>
        <div className="cl-id">
          <span className="cl-id__mark">
            <Building2 size={22} />
          </span>
          <div className="cl-id__text">
            <h1>{clinic.name}</h1>
            <p className="cl-id__meta">
              <span>{clinic.city ?? "City not set"}</span>
              <i />
              <span className="cl-mono">
                {clinic.registration_no
                  ? `Reg. ${clinic.registration_no}`
                  : "No reg. no."}
              </span>
              <i />
              <span>
                {isClinicAdmin ? "You administer this clinic" : "You're a member"}
              </span>
              {!clinic.active && (
                <Badge tone="danger" dot>
                  suspended
                </Badge>
              )}
            </p>
          </div>

          <div className="cl-id__actions">
            {isClinicAdmin && (
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil size={14} /> Edit
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} /> Invite
            </Button>
          </div>
        </div>

        {/* The invite code, as a tear-off ticket rather than another pill. */}
        <div className="cl-ticket">
          <div className="cl-ticket__stub">Invite code</div>
          <code>{clinic.join_code}</code>
          <button type="button" onClick={() => void copyCode()} aria-label="Copy code">
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </header>

      {/* ---------------- facts + numbers ---------------- */}
      <section className="cl-facts" data-card>
        <dl className="cl-facts__list">
          <div>
            <dt>
              <Phone size={12} /> Phone
            </dt>
            <dd>{clinic.phone ?? "—"}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={12} /> Address
            </dt>
            <dd>{clinic.address ?? "—"}</dd>
          </div>
          <div>
            <dt>
              <CalendarClock size={12} /> Opened
            </dt>
            <dd>{formatDate(clinic.created_at)}</dd>
          </div>
        </dl>

        {isClinicAdmin && (
          <div className="cl-nums">
            {[
              ["Doctors", stats?.doctors_total, `${stats?.doctors_active ?? 0} active`],
              ["Patients", stats?.patients_total, "registered here"],
              [
                "Consultations",
                stats?.consultations_total,
                `${stats?.consultations_last_7_days ?? 0} in 7 days`,
              ],
              [
                "Finalized",
                stats?.consultations_finalized,
                `${stats?.consultations_draft_ready ?? 0} awaiting review`,
              ],
            ].map(([label, value, detail]) => (
              <div key={label as string}>
                <strong>{value ?? "—"}</strong>
                <span>{label}</span>
                <small>{detail}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {!isClinicAdmin ? (
        <section className="ui-card ui-card--pad cl-member-note" data-card>
          <ShieldCheck size={20} />
          <div>
            <strong>You see your own patients and consultations.</strong>
            <p className="muted">
              Clinic-wide lists are for the clinic&rsquo;s admins. Share the invite code
              above to bring a colleague in.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* ---------------- tabs ---------------- */}
          <div className="cl-tabs" role="tablist" data-card>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`cl-tab ${tab === t.id ? "cl-tab--on" : ""}`}
                onClick={() => {
                  haptic("bubble");
                  setTab(t.id);
                }}
              >
                {t.label}
                {t.count !== undefined && <span>{t.count}</span>}
              </button>
            ))}
          </div>

          <div className="ui-card cl-panel" data-card>
            {/* ---- doctors ---- */}
            {tab === "doctors" &&
              (membersQuery.loading ? (
                <SkeletonRows rows={4} height={52} />
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
                        {member.role === "admin" && (
                          <Badge tone="accent">clinic admin</Badge>
                        )}
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
                              <ShieldCheck size={13} /> Restore
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}

            {/* ---- patients ---- */}
            {tab === "patients" && (
              <>
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
                    title={patientQuery ? "No patients match" : "No patients yet"}
                    message={
                      patientQuery
                        ? "Try a different name or phone number."
                        : "They'll appear here as your doctors register them."
                    }
                  />
                ) : (
                  <>
                    {clinicPatients.map((patient) => {
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
                    })}
                    <div className="pts-foot cl-foot">
                      <span className="muted">
                        Showing {clinicPatients.length} of {clinicPatientTotal}
                      </span>
                      {clinicPatients.length < clinicPatientTotal &&
                        patientLimit < 200 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPatientLimit((n) => Math.min(n + 50, 200))}
                          >
                            Load more
                          </Button>
                        )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ---- activity ---- */}
            {tab === "activity" &&
              (consultationsQuery.loading ? (
                <SkeletonRows rows={4} height={52} />
              ) : consultations.length === 0 ? (
                <EmptyState
                  icon={<Activity size={22} />}
                  title="No consultations yet"
                  message="They'll appear here as your doctors record them."
                />
              ) : (
                consultations.slice(0, 40).map((item) => {
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
              ))}
          </div>
        </>
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
          You can practise at more than one clinic. Adding one switches you to it — the
          rail at the top of this page moves you back.
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
        <p style={{ color: "var(--ink-2)", fontSize: "0.92rem", marginBottom: 14 }}>
          Colleagues join by signing up and entering this code — no invitation email
          needed. They land in <strong>{clinic.name}</strong> as a regular doctor; you can
          promote them afterwards.
        </p>
        <div className="cl-ticket cl-ticket--lg">
          <div className="cl-ticket__stub">Invite code</div>
          <code>{clinic.join_code}</code>
        </div>
      </Modal>
    </main>
  );
}
