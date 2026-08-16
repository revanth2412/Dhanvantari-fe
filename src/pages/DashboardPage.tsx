import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  AudioLines,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  FilePenLine,
  Mic,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useMyPatients } from "@/hooks/useMyPatients";
import { searchPatients } from "@/services/patientService";
import { getMyStats } from "@/services/statsService";
import { getRecentSessions, type RecentSession } from "@/lib/recents";
import { consultationStatusMeta, timeAgo } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { Patient } from "@/types/patient";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { PatientFormDrawer } from "@/components/patients/PatientFormDrawer";

const IN_FLIGHT = ["uploaded", "transcribing", "extracting"] as const;

/**
 * Minutes of documentation the scribe is assumed to save per note it drafts.
 * This is an ESTIMATE and the card says so — we have no measured baseline for
 * how long the same doctor would have taken typing. Everything it multiplies
 * (the note count) is real, doctor-scoped data from `GET /stats/me`.
 */
const MINUTES_SAVED_PER_NOTE = 15;

function isInFlight(status: RecentSession["status"]): boolean {
  return (IN_FLIGHT as readonly string[]).includes(status);
}

/** `yyyy-mm-dd` in local time — what `<input type="date">` expects. */
function toInputDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toInputDate(d);
}

function StatCounter({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const target = ref.current;
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value,
      duration: 1.2,
      ease: "power3.out",
      onUpdate: () => {
        target.textContent = `${decimals > 0 ? counter.value.toFixed(decimals) : Math.round(counter.value)}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, suffix, decimals]);
  return (
    <span ref={ref}>
      {decimals > 0 ? (0).toFixed(decimals) : 0}
      {suffix}
    </span>
  );
}

export function DashboardPage() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLElement | null>(null);

  // States
  const [filterTab, setFilterTab] = useState<
    "all" | "drafts" | "in_flight" | "finalized"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Fetch recent sessions & stats
  const recents = useMemo(
    () =>
      doctor
        ? getRecentSessions(doctor.id).filter((item) => item.status !== "discarded")
        : [],
    [doctor],
  );

  const { data: patientsData, loading: patientsLoading } = useCachedQuery<Patient[]>(
    "patients:list:",
    () => searchPatients(),
  );
  // `GET /stats/me` is scoped to the signed-in doctor by the backend: counts
  // cover only consultations where `doctor_id` is this doctor.
  const { data: statsData } = useCachedQuery("stats:me", () => getMyStats());

  const fetchedPatients = useMemo(() => {
    return patientsLoading ? null : (patientsData ?? []);
  }, [patientsLoading, patientsData]);
  // Same rule as the roster page: a clinic admin's own patients, not the
  // clinic's. The clinic-wide directory lives on the clinic page.
  const { patients } = useMyPatients(fetchedPatients);

  // Date range for the session queue (empty string = open-ended).
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const drafts = useMemo(
    () => recents.filter((item) => item.status === "draft_ready"),
    [recents],
  );
  const live = useMemo(
    () => recents.filter((item) => isInFlight(item.status)),
    [recents],
  );
  const finalized = useMemo(
    () => recents.filter((item) => item.status === "finalized"),
    [recents],
  );

  const firstName = doctor?.full_name?.split(" ")[0] ?? "Doctor";

  // Filtered session list
  const filteredSessions = useMemo(() => {
    let list = recents;
    if (filterTab === "drafts") list = drafts;
    else if (filterTab === "in_flight") list = live;
    else if (filterTab === "finalized") list = finalized;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.patientName.toLowerCase().includes(q));
    }

    // Date range, inclusive on both ends; either bound may be left open.
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
    if (fromTs !== null || toTs !== null) {
      list = list.filter((s) => {
        const sessionTime = new Date(s.updatedAt).getTime();
        if (isNaN(sessionTime)) return false;
        if (fromTs !== null && sessionTime < fromTs) return false;
        if (toTs !== null && sessionTime > toTs) return false;
        return true;
      });
    }

    return list;
  }, [recents, drafts, live, finalized, filterTab, searchQuery, fromDate, toDate]);

  /* ---- metrics: every number below comes from the doctor's own /stats/me ---- */

  // Notes the scribe actually produced. Failed and still-processing
  // consultations produced nothing, so they don't count towards time saved.
  const notesDrafted = statsData ? statsData.finalized + statsData.draft_ready : null;
  const minutesReclaimed =
    notesDrafted === null ? null : notesDrafted * MINUTES_SAVED_PER_NOTE;
  const pendingSignOff = statsData?.draft_ready ?? drafts.length;

  // GSAP Entrance Animations
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-cockpit-elem]",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07, ease: "power3.out" },
      );

      gsap.fromTo(
        "[data-dash-card]",
        { autoAlpha: 0, y: 22, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.08,
          delay: 0.1,
          ease: "power3.out",
        },
      );

      gsap.fromTo(
        "[data-session-item]",
        { autoAlpha: 0, x: -12 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.04,
          delay: 0.2,
          ease: "power2.out",
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  function handleOpenSession(id: string) {
    haptic("light");
    navigate(`/consultations/${id}`);
  }

  function handleStartConsultation(patientId?: string) {
    haptic("medium");
    if (patientId) {
      navigate(`/consultations/new?patient_id=${patientId}`);
    } else {
      navigate("/consultations/new");
    }
  }

  return (
    <main className="page db-cockpit-root" ref={rootRef}>
      {/* ------------------------------------------------------------- */}
      {/* CLINICAL TELEMETRY STRIP                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="db-telemetry-strip" data-cockpit-elem>
        <div className="db-telemetry-left">
          <div className="db-doctor-node">
            <BrandMark size={32} className="db-brand-icon" />
            <div>
              <div className="db-doctor-title">
                <span>Dr. {doctor?.full_name ?? firstName}</span>
                <span className="db-doctor-role-tag">
                  {doctor?.specialty ?? "General Practice"}
                </span>
              </div>
              <div
                className="db-clinic-link"
                onClick={() => navigate("/clinic")}
                role="button"
                tabIndex={0}
              >
                <Stethoscope size={12} className="db-accent-icon" />
                <span>{doctor?.clinic_name ?? "Clinical Workspace"}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>

        <div className="db-telemetry-center">
          <div className="db-security-badge">
            <ShieldCheck size={13} className="db-icon-emerald" />
            <span>DPDP Act 2023 Enforced · Data Encryption Active</span>
          </div>
        </div>

        <div className="db-telemetry-right">
          <div className="db-clock-pill">
            <Calendar size={13} />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <button
            type="button"
            className="db-quick-patient-pill"
            onClick={() => setDrawerOpen(true)}
          >
            <UserPlus size={14} />
            <span>Register Patient</span>
          </button>
          <button
            type="button"
            className="db-quick-consult-pill"
            onClick={() => handleStartConsultation()}
          >
            <Mic size={14} />
            <span>Start Consultation</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BENTO METRICS MATRIX                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="db-bento-grid" aria-label="Your clinical activity">
        {/* Metric 1: estimated documentation time saved */}
        <article className="db-bento-card db-bento-card--primary" data-dash-card>
          <div className="db-bento-top">
            <span className="db-bento-label">TIME RECLAIMED · EST.</span>
            <div className="db-bento-icon db-bento-icon--emerald">
              <Clock size={16} />
            </div>
          </div>
          <div className="db-bento-value">
            {minutesReclaimed === null ? (
              <span className="db-bento-pending">—</span>
            ) : minutesReclaimed < 60 ? (
              <StatCounter value={minutesReclaimed} suffix=" min" />
            ) : (
              <StatCounter
                value={Math.round(minutesReclaimed / 6) / 10}
                decimals={1}
                suffix=" hrs"
              />
            )}
          </div>
          <div className="db-bento-footer">
            <span className="db-tag-pill db-tag-pill--green">
              <TrendingUp size={11} /> ≈{MINUTES_SAVED_PER_NOTE} min per note
            </span>
            <span className="db-bento-sub">
              {notesDrafted === null
                ? "Estimate from your drafted notes"
                : `From ${notesDrafted} note${notesDrafted === 1 ? "" : "s"} the scribe drafted`}
            </span>
          </div>
        </article>

        {/* Metric 2: distinct patients this doctor has consulted */}
        <article className="db-bento-card" data-dash-card>
          <div className="db-bento-top">
            <span className="db-bento-label">PATIENTS IN CARE</span>
            <div className="db-bento-icon db-bento-icon--blue">
              <UsersRound size={18} />
            </div>
          </div>
          <div className="db-bento-value">
            {statsData ? (
              <StatCounter value={statsData.patients_seen} />
            ) : (
              <span className="db-bento-pending">—</span>
            )}
          </div>
          <div className="db-bento-footer">
            <span className="db-bento-sub">Patients you have consulted</span>
            <span className="db-bento-link" onClick={() => navigate("/patients")}>
              View Directory <ChevronRight size={12} />
            </span>
          </div>
        </article>

        {/* Metric 3: draft notes awaiting this doctor's signature */}
        <article
          className={`db-bento-card ${pendingSignOff > 0 ? "db-bento-card--alert" : ""}`}
          data-dash-card
        >
          <div className="db-bento-top">
            <span className="db-bento-label">PENDING SIGN-OFF</span>
            <div className="db-bento-icon db-bento-icon--amber">
              <FilePenLine size={18} />
            </div>
          </div>
          <div className="db-bento-value">
            {statsData ? (
              <StatCounter value={pendingSignOff} />
            ) : (
              <span className="db-bento-pending">—</span>
            )}
          </div>
          <div className="db-bento-footer">
            {/* Don't claim "all signed off" before the count has arrived. */}
            {!statsData ? (
              <span className="db-tag-pill">Checking…</span>
            ) : pendingSignOff > 0 ? (
              <span className="db-tag-pill db-tag-pill--amber">
                <Sparkles size={11} /> Ready for review
              </span>
            ) : (
              <span className="db-tag-pill db-tag-pill--green">
                <CheckCircle2 size={11} /> All signed off
              </span>
            )}
            <span className="db-bento-sub">Draft notes awaiting you</span>
          </div>
        </article>

        {/* Metric 4: recent workload */}
        <article className="db-bento-card" data-dash-card>
          <div className="db-bento-top">
            <span className="db-bento-label">LAST 7 DAYS</span>
            <div className="db-bento-icon db-bento-icon--cyan">
              <CalendarClock size={18} />
            </div>
          </div>
          <div className="db-bento-value">
            {statsData ? (
              <StatCounter value={statsData.consultations_last_7_days} />
            ) : (
              <span className="db-bento-pending">—</span>
            )}
          </div>
          <div className="db-bento-footer">
            <span className="db-tag-pill db-tag-pill--cyan">
              {statsData
                ? `${statsData.consultations_last_30_days} in 30 days`
                : "Consultations"}
            </span>
            <span className="db-bento-sub">
              {statsData
                ? `${statsData.total_consultations} total · ${statsData.finalized} finalized`
                : "Your consultations"}
            </span>
          </div>
        </article>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* TWO-COLUMN VIEW: SESSION FEED & PATIENT ROSTER                */}
      {/* ------------------------------------------------------------- */}
      <div className="db-content-columns">
        {/* Left Column: Clinical Sessions Queue */}
        <section className="db-session-feed" data-dash-card>
          <div className="db-feed-header">
            <div className="db-feed-title-row">
              <div className="db-feed-title">
                <Radio size={16} className="db-icon-emerald" />
                <h2>Clinical Sessions Queue</h2>
                <span className="db-feed-count">{filteredSessions.length}</span>
              </div>

              {/* In-feed controls: search & date range */}
              <div className="db-feed-controls">
                <div className="db-feed-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Filter sessions…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date range: two pickers, plus presets for the common spans. */}
            <div className="db-date-range">
              <div className="db-date-field">
                <Calendar size={13} className="db-icon-emerald" />
                <label htmlFor="db-date-from">From</label>
                <input
                  id="db-date-from"
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="db-date-field">
                <label htmlFor="db-date-to">To</label>
                <input
                  id="db-date-to"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="db-date-presets">
                {(
                  [
                    ["Today", () => [toInputDate(new Date()), toInputDate(new Date())]],
                    ["7 days", () => [daysAgo(6), toInputDate(new Date())]],
                    ["30 days", () => [daysAgo(29), toInputDate(new Date())]],
                  ] as const
                ).map(([label, range]) => {
                  const [from, to] = range();
                  const active = fromDate === from && toDate === to;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`db-date-preset ${active ? "db-date-preset--active" : ""}`}
                      onClick={() => {
                        setFromDate(from);
                        setToDate(to);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    className="db-date-preset db-date-preset--clear"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="db-feed-tabs">
              <button
                type="button"
                className={`db-feed-tab ${filterTab === "all" ? "db-feed-tab--active" : ""}`}
                onClick={() => setFilterTab("all")}
              >
                All ({recents.length})
              </button>
              <button
                type="button"
                className={`db-feed-tab ${filterTab === "drafts" ? "db-feed-tab--active" : ""}`}
                onClick={() => setFilterTab("drafts")}
              >
                Needs Sign-off ({drafts.length})
              </button>
              <button
                type="button"
                className={`db-feed-tab ${filterTab === "in_flight" ? "db-feed-tab--active" : ""}`}
                onClick={() => setFilterTab("in_flight")}
              >
                Processing ({live.length})
              </button>
              <button
                type="button"
                className={`db-feed-tab ${filterTab === "finalized" ? "db-feed-tab--active" : ""}`}
                onClick={() => setFilterTab("finalized")}
              >
                Finalized ({finalized.length})
              </button>
            </div>
          </div>

          {/* Session List */}
          <div className="db-session-list">
            {filteredSessions.length === 0 ? (
              <div className="db-empty-feed">
                <EmptyState
                  icon={<AudioLines size={24} />}
                  title={
                    searchQuery
                      ? "No sessions match search"
                      : "No consultations in this queue"
                  }
                  message={
                    searchQuery
                      ? "Try searching by a different patient name."
                      : "Start a consultation to automatically generate structured clinical notes."
                  }
                  action={
                    !searchQuery && (
                      <Button variant="primary" onClick={() => handleStartConsultation()}>
                        <Mic size={15} /> Start Consultation
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              filteredSessions.map((session) => {
                const meta = consultationStatusMeta[session.status];
                const isDraft = session.status === "draft_ready";
                const isRunning = isInFlight(session.status);

                return (
                  <article
                    key={session.consultationId}
                    className={`db-session-card ${isDraft ? "db-session-card--draft" : ""} ${
                      isRunning ? "db-session-card--live" : ""
                    }`}
                    onClick={() => handleOpenSession(session.consultationId)}
                    data-session-item
                  >
                    <div className="db-sc-avatar">
                      <Avatar name={session.patientName} size={40} />
                    </div>

                    <div className="db-sc-body">
                      <strong className="db-sc-name">{session.patientName}</strong>
                      <div className="db-sc-meta">
                        <span className="db-sc-time">
                          <Clock size={12} /> {timeAgo(session.updatedAt)}
                        </span>
                        {isDraft && (
                          <span className="db-sc-draft-tag">
                            <Sparkles size={11} /> Review &amp; Sign
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="db-sc-action">
                      <Badge tone={meta.tone} className="db-sc-badge">
                        {meta.label}
                      </Badge>
                      <button
                        type="button"
                        className={`db-sc-btn ${isDraft ? "db-sc-btn--primary" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSession(session.consultationId);
                        }}
                      >
                        {isDraft ? "Review" : isRunning ? "View Status" : "Open Note"}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* The counts above are this queue's, not the doctor's full history:
              there is no list-consultations endpoint yet, so the queue is a
              local log of recent sessions. Say so rather than imply totals. */}
          {recents.length > 0 && (
            <p className="db-feed-note">
              Recent sessions from this device. Totals in the cards above come from your
              full record on the server.
            </p>
          )}
        </section>

        {/* Right Column: Practice Roster Snapshot */}
        <aside className="db-roster-sidebar" data-dash-card>
          <div className="db-roster-header">
            <div className="db-roster-title">
              <UsersRound size={16} className="db-icon-emerald" />
              <h3>Recent Patients</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/patients")}>
              All ({patients?.length ?? 0})
            </Button>
          </div>

          <div className="db-roster-list">
            {patients === null ? (
              <SkeletonRows rows={5} height={44} />
            ) : patients.length === 0 ? (
              <div className="db-roster-empty">
                <p>No patients registered yet.</p>
                <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>
                  <UserPlus size={14} /> Add Patient
                </Button>
              </div>
            ) : (
              patients.slice(0, 6).map((patient) => (
                <div
                  key={patient.id}
                  className="db-roster-item"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <Avatar name={patient.full_name} size={34} />
                  <div className="db-roster-info">
                    <strong>{patient.full_name}</strong>
                    <small>
                      {patient.gender ?? "Patient"} · {patient.phone ?? "No phone"}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="db-roster-consult-btn"
                    title="Start consultation for this patient"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartConsultation(patient.id);
                    }}
                  >
                    <Mic size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="db-roster-footer">
            <Button
              variant="secondary"
              size="md"
              className="db-roster-add-btn"
              onClick={() => setDrawerOpen(true)}
            >
              <UserPlus size={15} /> Register New Patient
            </Button>
          </div>
        </aside>
      </div>

      {/* Patient Creation Drawer */}
      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(patient) => {
          setDrawerOpen(false);
          handleStartConsultation(patient.id);
        }}
      />
    </main>
  );
}
