import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  ChevronRight,
  ClipboardCheck,
  FileAudio,
  Mic,
  NotebookPen,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { searchPatients } from "@/services/patientService";
import { getRecentSessions, type RecentSession } from "@/lib/recents";
import { consultationStatusMeta, greetingForNow, timeAgo } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { Patient } from "@/types/patient";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useReveal } from "@/hooks/useReveal";

/** Statuses that mean the backend is still working on a session. */
const IN_FLIGHT = ["uploaded", "transcribing", "extracting"] as const;

function isInFlight(status: RecentSession["status"]): boolean {
  return (IN_FLIGHT as readonly string[]).includes(status);
}

/** Count-up animation — numbers roll into place on mount. */
function StatValue({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const counter = { n: 0 };
    const tween = gsap.to(counter, {
      n: value,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = String(Math.round(counter.n));
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return <span ref={ref}>0</span>;
}

interface QuickTileProps {
  icon: ReactNode;
  label: string;
  tone?: "jade" | "saffron" | "info";
  badge?: number;
  onClick: () => void;
}

function QuickTile({ icon, label, tone = "jade", badge, onClick }: QuickTileProps) {
  return (
    <button
      type="button"
      className="quick-tile"
      onClick={() => {
        haptic("light");
        onClick();
      }}
    >
      <span
        className={`quick-tile__icon ${tone !== "jade" ? `quick-tile__icon--${tone}` : ""}`}
      >
        {icon}
      </span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="quick-tile__badge">{badge}</span>
      )}
    </button>
  );
}

export function DashboardPage() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const recents = useMemo<RecentSession[]>(
    // Discarded sessions are soft-deleted — keep them out of the listing, the
    // same way the backend hides them from its own queries.
    () =>
      doctor ? getRecentSessions(doctor.id).filter((s) => s.status !== "discarded") : [],
    [doctor],
  );
  // Shares its cache entry with the Patients page's unfiltered list.
  const { data, loading } = useCachedQuery<Patient[]>("patients:list:", () =>
    searchPatients(),
  );
  const patients = loading ? null : (data ?? []);
  const revealRef = useReveal<HTMLDivElement>("[data-reveal]", [patients !== null]);

  const draftCount = recents.filter((r) => r.status === "draft_ready").length;
  const finalizedCount = recents.filter((r) => r.status === "finalized").length;
  const liveCount = recents.filter((r) => isInFlight(r.status)).length;
  const firstName = doctor?.full_name?.split(" ").slice(-1)[0] ?? "Doctor";

  function openSession(id: string) {
    haptic("light");
    navigate(`/consultations/${id}`);
  }

  return (
    <main className="page" ref={revealRef}>
      {/* Mobile app header — desktop keeps the hero as its heading. */}
      <header className="dash-top">
        <Avatar name={doctor?.full_name} size={42} />
        <div className="dash-top__meta">
          <div className="dash-top__hi">{greetingForNow()}</div>
          <div className="dash-top__name">{doctor?.full_name ?? "Doctor"}</div>
        </div>
        {liveCount > 0 && (
          <span className="dash-top__live">
            <Badge tone="info" live dot>
              {liveCount} processing
            </Badge>
          </span>
        )}
        <BrandMark size={36} />
      </header>

      <section className="dash-hero" data-reveal>
        <svg
          className="dash-hero__ecg"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 34 H58 l9 -20 l11 36 l9 -16 H150 l10 -26 l12 44 l9 -18 H262 l9 -14 l10 26 l8 -12 H400" />
        </svg>

        <div className="dash-hero__text">
          <h1>
            {greetingForNow()}, {firstName}
          </h1>
          <p>
            Record a consultation and have the clinical note drafted before the patient
            leaves.
          </p>
        </div>
        <div className="dash-hero__cta">
          <Button
            variant="primary"
            size="lg"
            haptics="medium"
            onClick={() => navigate("/consultations/new")}
          >
            <Mic size={18} /> Start consultation
          </Button>
          <Button
            size="lg"
            style={{
              background: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.2)",
              color: "#fff",
            }}
            onClick={() => navigate("/patients")}
          >
            <UserPlus size={18} /> Add patient
          </Button>
        </div>
      </section>

      {/* Thumb-reachable shortcuts (mobile only). */}
      <nav className="quick-grid" aria-label="Quick actions">
        <QuickTile
          icon={<Mic size={18} />}
          label="Record"
          onClick={() => navigate("/consultations/new")}
        />
        <QuickTile
          icon={<NotebookPen size={18} />}
          label="Drafts"
          tone="saffron"
          badge={draftCount}
          onClick={() => {
            const draft = recents.find((r) => r.status === "draft_ready");
            navigate(draft ? `/consultations/${draft.consultationId}` : "/patients");
          }}
        />
        <QuickTile
          icon={<Users size={18} />}
          label="Patients"
          tone="info"
          onClick={() => navigate("/patients")}
        />
      </nav>

      <section className="stat-rail">
        <div className="ui-card stat-card" data-reveal>
          <span className="stat-card__icon stat-card__icon--jade">
            <Users size={22} />
          </span>
          <div>
            <div className="stat-card__value">
              {patients ? <StatValue value={patients.length} /> : "…"}
            </div>
            <div className="stat-card__label">Patients on file</div>
          </div>
        </div>
        <div className="ui-card stat-card" data-reveal>
          <span className="stat-card__icon stat-card__icon--saffron">
            <NotebookPen size={22} />
          </span>
          <div>
            <div className="stat-card__value">
              <StatValue value={draftCount} />
            </div>
            <div className="stat-card__label">Drafts awaiting your review</div>
          </div>
        </div>
        <div className="ui-card stat-card" data-reveal>
          <span className="stat-card__icon stat-card__icon--info">
            <ClipboardCheck size={22} />
          </span>
          <div>
            <div className="stat-card__value">
              <StatValue value={finalizedCount} />
            </div>
            <div className="stat-card__label">Notes finalized recently</div>
          </div>
        </div>
      </section>

      <section className="dash-cols">
        <div className="ui-card" data-reveal>
          <div className="panel-head">
            <h2>Recent sessions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/consultations/new")}
            >
              <Mic size={14} /> New
            </Button>
          </div>
          <div style={{ paddingTop: 8 }}>
            {recents.length === 0 ? (
              <EmptyState
                icon={<FileAudio size={24} />}
                title="No sessions yet"
                message="Start your first consultation — the recording, transcript, and draft note will show up here."
                action={
                  <Button
                    variant="primary"
                    onClick={() => navigate("/consultations/new")}
                  >
                    <Mic size={16} /> Start consultation
                  </Button>
                }
              />
            ) : (
              recents.map((session) => {
                const meta = consultationStatusMeta[session.status];
                return (
                  <div
                    key={session.consultationId}
                    className="session-row"
                    onClick={() => openSession(session.consultationId)}
                  >
                    <Avatar name={session.patientName} size={36} />
                    <div className="session-row__meta">
                      <div className="session-row__name">{session.patientName}</div>
                      <div className="session-row__sub">{timeAgo(session.updatedAt)}</div>
                    </div>
                    <Badge tone={meta.tone} dot live={isInFlight(session.status)}>
                      {meta.label}
                    </Badge>
                    <ChevronRight size={16} className="session-row__chev" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="ui-card" data-reveal>
          <div className="panel-head">
            <h2>Patients</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/patients")}>
              View all
            </Button>
          </div>
          <div style={{ paddingTop: 8 }}>
            {patients === null ? (
              <SkeletonRows rows={4} height={40} />
            ) : patients.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="No patients yet"
                message="Add your first patient to start a consultation."
                action={
                  <Button variant="primary" onClick={() => navigate("/patients")}>
                    <UserPlus size={16} /> Add patient
                  </Button>
                }
              />
            ) : (
              patients.slice(0, 6).map((patient) => (
                <div
                  key={patient.id}
                  className="session-row"
                  onClick={() => {
                    haptic("light");
                    navigate(`/patients/${patient.id}`);
                  }}
                >
                  <Avatar name={patient.full_name} size={36} />
                  <div className="session-row__meta">
                    <div className="session-row__name">{patient.full_name}</div>
                    <div className="session-row__sub">{patient.phone ?? "No phone"}</div>
                  </div>
                  <ChevronRight size={16} className="session-row__chev" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
