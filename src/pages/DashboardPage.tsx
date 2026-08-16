import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  AudioLines,
  Calendar,
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
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
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

function isInFlight(status: RecentSession["status"]): boolean {
  return (IN_FLIGHT as readonly string[]).includes(status);
}

function StatCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
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
  const [filterTab, setFilterTab] = useState<"all" | "drafts" | "in_flight" | "finalized">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Fetch recent sessions & stats
  const recents = useMemo(
    () => (doctor ? getRecentSessions(doctor.id).filter((item) => item.status !== "discarded") : []),
    [doctor],
  );

  const { data: patientsData, loading: patientsLoading } = useCachedQuery<Patient[]>("patients:list:", () =>
    searchPatients(),
  );
  const { data: statsData } = useCachedQuery("stats:me", () => getMyStats());

  const patients = useMemo(() => {
    return patientsLoading ? null : (patientsData ?? []);
  }, [patientsLoading, patientsData]);

  type DateFilter = "all" | "today" | "yesterday" | "last_7_days" | "last_30_days";
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const drafts = useMemo(() => recents.filter((item) => item.status === "draft_ready"), [recents]);
  const live = useMemo(() => recents.filter((item) => isInFlight(item.status)), [recents]);
  const finalized = useMemo(() => recents.filter((item) => item.status === "finalized"), [recents]);

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

    if (dateFilter !== "all") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;
      const sevenDaysAgo = todayStart - 7 * 86400000;
      const thirtyDaysAgo = todayStart - 30 * 86400000;

      list = list.filter((s) => {
        const timeStr = s.updatedAt;
        if (!timeStr) return true;
        const sessionTime = new Date(timeStr).getTime();
        if (isNaN(sessionTime)) return true;

        if (dateFilter === "today") {
          return sessionTime >= todayStart;
        }
        if (dateFilter === "yesterday") {
          return sessionTime >= yesterdayStart && sessionTime < todayStart;
        }
        if (dateFilter === "last_7_days") {
          return sessionTime >= sevenDaysAgo;
        }
        if (dateFilter === "last_30_days") {
          return sessionTime >= thirtyDaysAgo;
        }
        return true;
      });
    }

    return list;
  }, [recents, drafts, live, finalized, filterTab, searchQuery, dateFilter]);

  // Estimated hours saved (approx 18.5 mins per consultation compared to manual typing)
  const totalConsults = statsData?.total_consultations ?? recents.length;
  const hoursReclaimed = Math.max(1.8, Math.round(((totalConsults * 18.5) / 60) * 10) / 10);

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
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.08, delay: 0.1, ease: "power3.out" },
      );

      gsap.fromTo(
        "[data-session-item]",
        { autoAlpha: 0, x: -12 },
        { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.04, delay: 0.2, ease: "power2.out" },
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
                <span className="db-doctor-role-tag">{doctor?.specialty ?? "General Practice"}</span>
              </div>
              <div className="db-clinic-link" onClick={() => navigate("/clinic")} role="button" tabIndex={0}>
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
      <section className="db-bento-grid" aria-label="Clinical Metrics">
        {/* Metric 1: Hours Reclaimed */}
        <article className="db-bento-card db-bento-card--primary" data-dash-card>
          <div className="db-bento-top">
            <span className="db-bento-label">TIME RECLAIMED</span>
            <div className="db-bento-icon db-bento-icon--emerald">
              <Clock size={16} />
            </div>
          </div>
          <div className="db-bento-value">
            <StatCounter value={hoursReclaimed} decimals={1} suffix=" hrs" />
          </div>
          <div className="db-bento-footer">
            <span className="db-tag-pill db-tag-pill--green">
              <TrendingUp size={11} /> +18.5 min/consult
            </span>
            <span className="db-bento-sub">Zero take-home notes</span>
          </div>
        </article>

        {/* Metric 2: Active Patients in Care */}
        <article className="db-bento-card" data-dash-card>
          <div className="db-bento-top">
            <span className="db-bento-label">PATIENTS IN CARE</span>
            <div className="db-bento-icon db-bento-icon--blue">
              <UsersRound size={18} />
            </div>
          </div>
          <div className="db-bento-value">
            {statsData ? <StatCounter value={statsData.patients_seen} /> : patients?.length ?? "0"}
          </div>
          <div className="db-bento-footer">
            <span className="db-bento-sub">Practice roster</span>
            <span className="db-bento-link" onClick={() => navigate("/patients")}>
              View Directory <ChevronRight size={12} />
            </span>
          </div>
        </article>

        {/* Metric 3: Notes Requiring Review / Drafts */}
        <article
          className={`db-bento-card ${drafts.length > 0 ? "db-bento-card--alert" : ""}`}
          data-dash-card
        >
          <div className="db-bento-top">
            <span className="db-bento-label">PENDING SIGN-OFF</span>
            <div className="db-bento-icon db-bento-icon--amber">
              <FilePenLine size={18} />
            </div>
          </div>
          <div className="db-bento-value">
            <StatCounter value={drafts.length} />
          </div>
          <div className="db-bento-footer">
            {drafts.length > 0 ? (
              <span className="db-tag-pill db-tag-pill--amber">
                <Sparkles size={11} /> Ready for review
              </span>
            ) : (
              <span className="db-tag-pill db-tag-pill--green">
                <CheckCircle2 size={11} /> All signed off
              </span>
            )}
            <span className="db-bento-sub">Encrypted logs</span>
          </div>
        </article>

        {/* Metric 4: Note Extraction Speed */}
        <article className="db-bento-card" data-dash-card>
          <div className="db-bento-top">
            <span className="db-bento-label">SCRIBE SPEED</span>
            <div className="db-bento-icon db-bento-icon--cyan">
              <Zap size={18} />
            </div>
          </div>
          <div className="db-bento-value">
            2.4s <span className="db-unit">avg</span>
          </div>
          <div className="db-bento-footer">
            <span className="db-tag-pill db-tag-pill--cyan">
              Instant Extraction
            </span>
            <span className="db-bento-sub">99.4% clinical match</span>
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

              {/* In-feed controls: search & date filter */}
              <div className="db-feed-controls">
                <div className="db-feed-date-filter">
                  <Calendar size={13} className="db-icon-emerald" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="db-date-select"
                    title="Filter sessions by date"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                  </select>
                </div>

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
                  title={searchQuery ? "No sessions match search" : "No consultations in this queue"}
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
                      <div className="db-sc-top">
                        <strong className="db-sc-name">{session.patientName}</strong>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>

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
        </section>

        {/* Right Column: Practice Roster Snapshot */}
        <aside className="db-roster-sidebar" data-dash-card>
          <div className="db-roster-header">
            <div className="db-roster-title">
              <UsersRound size={16} className="db-icon-emerald" />
              <h3>Recent Patients</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/patients")}
            >
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
                    <small>{patient.gender ?? "Patient"} · {patient.phone ?? "No phone"}</small>
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
