import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  AudioLines,
  BadgeCheck,
  Brain,
  Briefcase,
  Bus,
  Cake,
  CalendarClock,
  Check,
  Cigarette,
  ClipboardList,
  Copy,
  Droplets,
  Dumbbell,
  FileQuestion,
  Fingerprint,
  FlaskConical,
  Gauge,
  HeartHandshake,
  HeartPulse,
  History,
  Home,
  Leaf,
  Lightbulb,
  Lock,
  MessageSquareQuote,
  NotebookPen,
  Pencil,
  Pill,
  Plus,
  Stethoscope,
  Thermometer,
  User,
  Users,
  Utensils,
  Weight,
  Wind,
  Wine,
  X,
} from "lucide-react";
import {
  finalizeRecord,
  getConsultationRecord,
  updateRecord,
} from "@/services/recordService";
import type { Consultation } from "@/types/consultation";
import type { Patient, SocialHistory, SubstanceUse } from "@/types/patient";
import type { ClinicalNote, ClinicalRecord } from "@/types/record";
import { ageFromDob, formatDate, formatDateTime } from "@/lib/format";
import { buildNoteText } from "@/lib/noteText";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/* ================= normalization ================= */

function normalizeSubstance(s: SubstanceUse | undefined): SubstanceUse {
  return { status: s?.status ?? null, detail: s?.detail ?? null };
}

function normalizeSocial(sh: SocialHistory | undefined): SocialHistory {
  return {
    residence: sh?.residence ?? null,
    occupation: sh?.occupation ?? null,
    family_details: sh?.family_details ?? null,
    marital_status: sh?.marital_status ?? null,
    smoking: normalizeSubstance(sh?.smoking),
    alcohol: normalizeSubstance(sh?.alcohol),
    recreational_drugs: normalizeSubstance(sh?.recreational_drugs),
    exercise: sh?.exercise ?? null,
    diet: sh?.diet ?? null,
    commute: sh?.commute ?? null,
    mental_health: sh?.mental_health ?? null,
    other: [...(sh?.other ?? [])],
  };
}

/** Materialize every optional field so edit mode can mutate safely. */
function normalize(note: ClinicalNote): ClinicalNote {
  return {
    patient: {
      name: note.patient?.name ?? null,
      age: note.patient?.age ?? null,
      gender: note.patient?.gender ?? null,
      identifiers_mentioned: [...(note.patient?.identifiers_mentioned ?? [])],
    },
    social_history: normalizeSocial(note.social_history),
    chief_complaint: note.chief_complaint ?? null,
    symptoms: (note.symptoms ?? []).map((s) => ({ ...s })),
    history: {
      medical: [...(note.history?.medical ?? [])],
      medications_current: [...(note.history?.medications_current ?? [])],
      allergies: [...(note.history?.allergies ?? [])],
    },
    vitals_mentioned: (note.vitals_mentioned ?? []).map((v) => ({ ...v })),
    diagnosis: (note.diagnosis ?? []).map((d) => ({ ...d })),
    prescriptions: (note.prescriptions ?? []).map((p) => ({ ...p })),
    tests_ordered: [...(note.tests_ordered ?? [])],
    advice: [...(note.advice ?? [])],
    follow_up: {
      required: note.follow_up?.required ?? false,
      after_days: note.follow_up?.after_days ?? null,
      reason: note.follow_up?.reason ?? null,
    },
    red_flags: [...(note.red_flags ?? [])],
    extraction_confidence: note.extraction_confidence ?? 0,
    unclear_segments: [...(note.unclear_segments ?? [])],
  };
}

/* ================= small building blocks ================= */

type SectionTone = "jade" | "danger" | "accent" | "info";

function NSec({
  icon,
  title,
  tone = "jade",
  tint,
  count,
  span = 6,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone?: SectionTone;
  /** Card background tint for high-attention sections. */
  tint?: "danger" | "saffron";
  count?: number;
  /** Width in the 12-column note layout. */
  span?: 3 | 4 | 5 | 6 | 7 | 12;
  children: ReactNode;
}) {
  const iconTone = tone === "jade" ? "" : `nsec__icon--${tone}`;
  return (
    <section className={`nsec nsec--s${span} ${tint ? `nsec--${tint}` : ""}`}>
      <div className="nsec__head">
        <span className={`nsec__icon ${iconTone}`}>{icon}</span>
        <span className="nsec__title">{title}</span>
        {count !== undefined && count > 0 && <span className="nsec__count">{count}</span>}
      </div>
      {/* Fixed-size card: overflowing content scrolls in here, never grows the card. */}
      <div className="nsec__body">{children}</div>
    </section>
  );
}

function IRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="irow">
      <span className="irow__icon">{icon}</span>
      <span className="irow__k">{label}</span>
      <span className="irow__v">{value}</span>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const r = 18;
  const c = 2 * Math.PI * r;
  const color =
    pct >= 75 ? "var(--green-500)" : pct >= 45 ? "var(--saffron-500)" : "var(--danger)";
  return (
    <div className="conf-ring" title={`AI extraction confidence: ${pct}%`}>
      <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={4.5}
        />
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 900ms var(--ease-out)" }}
        />
      </svg>
      <span className="conf-ring__val">{pct}%</span>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="onb-chips">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="ui-chip ui-chip--static">
          {item}
        </span>
      ))}
    </div>
  );
}

function ChipEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const value = input.trim();
    if (!value) return;
    onChange([...items, value]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.length > 0 && (
        <div className="onb-chips">
          {items.map((item, i) => (
            <span key={`${item}-${i}`} className="ui-chip ui-chip--static">
              {item}
              <button
                type="button"
                className="ui-chip__x"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${item}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="ui-field__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        <Button size="sm" onClick={add} style={{ height: 36 }}>
          <Plus size={14} /> Add
        </Button>
      </div>
    </div>
  );
}

/** Pick a meaningful icon for a vital by its name. */
function vitalIcon(type: string): ReactNode {
  const t = type.toLowerCase();
  if (/bp|pressure/.test(t)) return <Gauge size={14} />;
  if (/temp|fever/.test(t)) return <Thermometer size={14} />;
  if (/pulse|heart/.test(t)) return <HeartPulse size={14} />;
  if (/spo2|oxygen|sat/.test(t)) return <Droplets size={14} />;
  if (/weight|bmi/.test(t)) return <Weight size={14} />;
  if (/sugar|glucose|hba1c/.test(t)) return <FlaskConical size={14} />;
  if (/resp|breath/.test(t)) return <Wind size={14} />;
  return <Activity size={14} />;
}

const SUBSTANCE_OPTIONS = ["never", "former", "occasional", "current"];

function substanceText(s: SubstanceUse | undefined): string | null {
  if (!s?.status && !s?.detail) return null;
  return [s.status, s.detail].filter(Boolean).join(" — ");
}

/* ================= main panel ================= */

interface NotePanelProps {
  consultation: Consultation;
  /** Registered patient record — rendered in the merged header block. */
  patient?: Patient | null;
  patientName?: string | null;
  onBack: () => void;
  onShowTranscript: () => void;
  onFinalized: () => void;
}

export function NotePanel({
  consultation,
  patient,
  patientName,
  onBack,
  onShowTranscript,
  onFinalized,
}: NotePanelProps) {
  const { doctor } = useAuth();
  const toast = useToast();

  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClinicalNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getConsultationRecord(consultation.id)
      .then((r) => {
        if (!cancelled) setRecord(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [consultation.id]);

  const note = useMemo(() => (record ? normalize(record.data) : null), [record]);
  const view = editing && draft ? draft : note;
  const isFinal = record?.status === "final";

  function startEdit() {
    if (!note) return;
    setDraft(normalize(note));
    setEditing(true);
  }

  function patchDraft(patch: Partial<ClinicalNote>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function patchSocial(patch: Partial<SocialHistory>) {
    setDraft((prev) =>
      prev ? { ...prev, social_history: { ...prev.social_history, ...patch } } : prev,
    );
  }

  function patchSubstance(
    key: "smoking" | "alcohol" | "recreational_drugs",
    patch: Partial<SubstanceUse>,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const social = { ...prev.social_history };
      social[key] = { ...social[key], ...patch };
      return { ...prev, social_history: social };
    });
  }

  async function handleSave() {
    if (!record || !draft) return;
    setSaving(true);
    try {
      const next = await updateRecord(record.id, {
        data: draft,
        reviewed_by: doctor?.full_name ?? null,
      });
      setRecord(next);
      setEditing(false);
      toast({
        kind: "success",
        title: `Saved as version ${next.version}`,
        message: "Previous versions are kept — nothing is overwritten.",
      });
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not save the note",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!record) return;
    setFinalizing(true);
    try {
      const next = await finalizeRecord(record.id, doctor?.full_name ?? null);
      setRecord(next);
      setFinalizeOpen(false);
      toast({
        kind: "success",
        title: "Note finalized",
        message: "The record is now locked.",
      });
      onFinalized();
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not finalize",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setFinalizing(false);
    }
  }

  async function handleCopy() {
    if (!view) return;
    try {
      await navigator.clipboard.writeText(buildNoteText(view, patientName));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ kind: "error", title: "Copy failed" });
    }
  }

  if (failed) {
    return (
      <div className="ui-card">
        <EmptyState
          icon={<FileQuestion size={24} />}
          title="Note not available"
          message="The clinical note for this consultation could not be loaded."
        />
      </div>
    );
  }

  if (!record || !view) {
    return (
      <div className="ui-card">
        <SkeletonRows rows={8} height={44} />
      </div>
    );
  }

  const sh = view.social_history ?? {};
  const followUp = view.follow_up;
  const pt = view.patient ?? {};

  const socialRows: Array<{ icon: ReactNode; label: string; value: string | null }> = [
    { icon: <Home size={15} />, label: "Residence", value: sh.residence ?? null },
    { icon: <Briefcase size={15} />, label: "Occupation", value: sh.occupation ?? null },
    { icon: <Users size={15} />, label: "Family", value: sh.family_details ?? null },
    {
      icon: <HeartHandshake size={15} />,
      label: "Marital status",
      value: sh.marital_status ?? null,
    },
    { icon: <Cigarette size={15} />, label: "Smoking", value: substanceText(sh.smoking) },
    { icon: <Wine size={15} />, label: "Alcohol", value: substanceText(sh.alcohol) },
    {
      icon: <Leaf size={15} />,
      label: "Recreational drugs",
      value: substanceText(sh.recreational_drugs),
    },
    { icon: <Dumbbell size={15} />, label: "Exercise", value: sh.exercise ?? null },
    { icon: <Utensils size={15} />, label: "Diet", value: sh.diet ?? null },
    { icon: <Bus size={15} />, label: "Commute", value: sh.commute ?? null },
    {
      icon: <Brain size={15} />,
      label: "Mental health",
      value: sh.mental_health ?? null,
    },
  ];
  const filledSocial = socialRows.filter((r) => r.value);

  const patientRows: Array<{ icon: ReactNode; label: string; value: string | null }> = [
    { icon: <User size={15} />, label: "Name (as heard)", value: pt.name ?? null },
    { icon: <Cake size={15} />, label: "Age", value: pt.age ?? null },
    { icon: <Users size={15} />, label: "Gender", value: pt.gender ?? null },
    {
      icon: <Fingerprint size={15} />,
      label: "Identifiers",
      value: pt.identifiers_mentioned?.length
        ? pt.identifiers_mentioned.join(", ")
        : null,
    },
  ];
  const filledPatient = patientRows.filter((r) => r.value);

  // Every section always renders — empty ones show a neutral placeholder so
  // the grid never has blank gaps and the doctor sees what wasn't captured.
  const has = {
    redFlags: (view.red_flags?.length ?? 0) > 0,
    history:
      (view.history?.medical?.length ?? 0) > 0 ||
      (view.history?.medications_current?.length ?? 0) > 0 ||
      (view.history?.allergies?.length ?? 0) > 0,
    tests: (view.tests_ordered?.length ?? 0) > 0,
    advice: (view.advice?.length ?? 0) > 0,
    unclear: (view.unclear_segments?.length ?? 0) > 0,
  };

  // Follow-up is a header chip, not a section: the actual date, computed from
  // the note's "after N days" relative to the consultation.
  const fuDays = followUp?.required ? (followUp.after_days ?? null) : null;
  const fuDateIso = fuDays
    ? new Date(new Date(record.created_at).getTime() + fuDays * 86400000).toISOString()
    : null;

  const headerSub = [
    ageFromDob(patient?.dob),
    patient?.gender,
    patient?.phone,
    `v${record.version}`,
    formatDateTime(record.created_at),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`note-shell ${editing ? "note-shell--editing" : ""}`}>
      {/* ---------- sticky toolbar ---------- */}
      <div className="ui-card note-topbar">
        <div className="note-toolbar__meta">
          <Button size="sm" variant="ghost" iconOnly onClick={onBack} aria-label="Back">
            <ArrowLeft size={16} />
          </Button>
          <Avatar name={patient?.full_name ?? patientName} size={36} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              {patient?.full_name ?? patientName ?? "Clinical note"}
            </div>
            <div className="muted" style={{ fontSize: "0.76rem" }}>
              {headerSub}
            </div>
          </div>
          <Badge tone={isFinal ? "ok" : "warn"} dot>
            {isFinal ? "Final" : "Draft"}
          </Badge>
          {followUp?.required && (
            <Badge tone="info">
              <CalendarClock size={11} /> Follow-up{" "}
              {fuDateIso ? `${formatDate(fuDateIso)} (in ${fuDays}d)` : "required"}
            </Badge>
          )}
          <ConfidenceRing value={view.extraction_confidence ?? 0} />
        </div>
        <div className="note-toolbar__actions">
          <Button size="sm" variant="ghost" onClick={onShowTranscript}>
            <AudioLines size={14} /> Transcript
          </Button>
          <Button size="sm" onClick={() => void handleCopy()}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copied ? "Copied" : "Copy"}
          </Button>
          {!isFinal && !editing && (
            <>
              <Button size="sm" onClick={startEdit}>
                <Pencil size={14} /> Edit note
              </Button>
              <Button size="sm" variant="primary" onClick={() => setFinalizeOpen(true)}>
                <BadgeCheck size={15} /> Finalize
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={saving}
                onClick={() => void handleSave()}
              >
                <Check size={15} /> Save new version
              </Button>
            </>
          )}
        </div>
      </div>

      {isFinal && (
        <div className="final-banner">
          <Lock size={17} />
          Finalized {record.finalized_at ? formatDateTime(record.finalized_at) : ""} —
          this record is locked and preserved.
        </div>
      )}

      <div className="note-grid">
        {/* ---------- red flags ---------- */}
        <NSec
          icon={<AlertOctagon size={16} />}
          title="Red flags"
          tone="danger"
          tint={has.redFlags ? "danger" : undefined}
          count={view.red_flags?.length}
          span={12}
        >
          {editing && draft ? (
            <ChipEditor
              items={draft.red_flags ?? []}
              onChange={(red_flags) => patchDraft({ red_flags })}
              placeholder="Add a red flag…"
            />
          ) : has.redFlags ? (
            view.red_flags?.map((flag, i) => (
              <div className="redflag" key={i}>
                <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {flag}
              </div>
            ))
          ) : (
            <p className="nsec__empty">None identified in this consultation.</p>
          )}
        </NSec>

        {/* ---------- row: chief complaint + vitals ---------- */}
        <NSec icon={<MessageSquareQuote size={16} />} title="Chief complaint" span={7}>
          {editing && draft ? (
            <TextAreaField
              value={draft.chief_complaint ?? ""}
              onChange={(e) => patchDraft({ chief_complaint: e.target.value || null })}
              placeholder="Primary reason for the visit"
              rows={2}
            />
          ) : view.chief_complaint ? (
            <div className="note-cc">{view.chief_complaint}</div>
          ) : (
            <p className="nsec__empty">Not captured in this consultation.</p>
          )}
        </NSec>

        <NSec
          icon={<Activity size={16} />}
          title="Vitals mentioned"
          tone="info"
          count={view.vitals_mentioned?.length}
          span={5}
        >
          {editing && draft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(draft.vitals_mentioned ?? []).map((vital, i) => (
                <div
                  className="note-edit-row"
                  key={i}
                  style={{ gridTemplateColumns: "1fr 1fr auto" }}
                >
                  <input
                    className="ui-field__input"
                    value={vital.type}
                    placeholder="Vital (e.g. BP)"
                    onChange={(e) =>
                      patchDraft({
                        vitals_mentioned: draft.vitals_mentioned?.map((v, j) =>
                          j === i ? { ...v, type: e.target.value } : v,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={vital.value}
                    placeholder="Value"
                    onChange={(e) =>
                      patchDraft({
                        vitals_mentioned: draft.vitals_mentioned?.map((v, j) =>
                          j === i ? { ...v, value: e.target.value } : v,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() =>
                      patchDraft({
                        vitals_mentioned: draft.vitals_mentioned?.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                    aria-label="Remove vital"
                  >
                    <X size={15} />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                className="note-add-btn"
                onClick={() =>
                  patchDraft({
                    vitals_mentioned: [
                      ...(draft.vitals_mentioned ?? []),
                      { type: "", value: "" },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add vital
              </Button>
            </div>
          ) : (view.vitals_mentioned?.length ?? 0) === 0 ? (
            <p className="nsec__empty">No vitals were mentioned.</p>
          ) : (
            <div className="vitals-wrap">
              {view.vitals_mentioned?.map((vital, i) => (
                <span className="vital-chip" key={i}>
                  {vitalIcon(vital.type)}
                  <span className="vital-chip__k">{vital.type}</span>
                  <span className="vital-chip__v">{vital.value}</span>
                </span>
              ))}
            </div>
          )}
        </NSec>

        {/* ---------- row: symptoms + diagnosis ---------- */}
        <NSec
          icon={<Stethoscope size={16} />}
          title="Symptoms"
          count={view.symptoms?.length}
          span={6}
        >
          {editing && draft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(draft.symptoms ?? []).map((symptom, i) => (
                <div className="note-edit-grid note-edit-grid--sym" key={i}>
                  <input
                    className="ui-field__input"
                    value={symptom.name}
                    placeholder="Symptom"
                    onChange={(e) =>
                      patchDraft({
                        symptoms: draft.symptoms?.map((s, j) =>
                          j === i ? { ...s, name: e.target.value } : s,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={symptom.duration ?? ""}
                    placeholder="Duration"
                    onChange={(e) =>
                      patchDraft({
                        symptoms: draft.symptoms?.map((s, j) =>
                          j === i ? { ...s, duration: e.target.value || null } : s,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={symptom.severity ?? ""}
                    placeholder="Severity"
                    onChange={(e) =>
                      patchDraft({
                        symptoms: draft.symptoms?.map((s, j) =>
                          j === i ? { ...s, severity: e.target.value || null } : s,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={symptom.notes ?? ""}
                    placeholder="Notes"
                    onChange={(e) =>
                      patchDraft({
                        symptoms: draft.symptoms?.map((s, j) =>
                          j === i ? { ...s, notes: e.target.value || null } : s,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() =>
                      patchDraft({ symptoms: draft.symptoms?.filter((_, j) => j !== i) })
                    }
                    aria-label="Remove symptom"
                  >
                    <X size={15} />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                className="note-add-btn"
                onClick={() =>
                  patchDraft({
                    symptoms: [
                      ...(draft.symptoms ?? []),
                      { name: "", duration: null, severity: null, notes: null },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add symptom
              </Button>
            </div>
          ) : (view.symptoms?.length ?? 0) === 0 ? (
            <p className="nsec__empty">No symptoms captured.</p>
          ) : (
            <div className="sym-grid">
              {view.symptoms?.map((symptom, i) => (
                <div className="sym-card" key={i}>
                  <div className="sym-card__name">{symptom.name}</div>
                  <div className="sym-card__meta">
                    {symptom.duration && <Badge tone="info">{symptom.duration}</Badge>}
                    {symptom.severity && <Badge tone="accent">{symptom.severity}</Badge>}
                  </div>
                  {symptom.notes && <p className="sym-card__notes">{symptom.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </NSec>

        <NSec
          icon={<HeartPulse size={16} />}
          title="Diagnosis"
          count={view.diagnosis?.length}
          span={6}
        >
          {editing && draft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(draft.diagnosis ?? []).map((dx, i) => (
                <div
                  className="note-edit-grid"
                  key={i}
                  style={{ gridTemplateColumns: "2fr 1fr 1fr auto" }}
                >
                  <input
                    className="ui-field__input"
                    value={dx.condition}
                    placeholder="Condition"
                    onChange={(e) =>
                      patchDraft({
                        diagnosis: draft.diagnosis?.map((d, j) =>
                          j === i ? { ...d, condition: e.target.value } : d,
                        ),
                      })
                    }
                  />
                  <select
                    className="ui-field__input"
                    value={dx.certainty ?? ""}
                    onChange={(e) =>
                      patchDraft({
                        diagnosis: draft.diagnosis?.map((d, j) =>
                          j === i ? { ...d, certainty: e.target.value || null } : d,
                        ),
                      })
                    }
                  >
                    <option value="">certainty…</option>
                    <option value="provisional">provisional</option>
                    <option value="confirmed">confirmed</option>
                    <option value="differential">differential</option>
                  </select>
                  <input
                    className="ui-field__input"
                    value={dx.icd10_hint ?? ""}
                    placeholder="ICD-10"
                    onChange={(e) =>
                      patchDraft({
                        diagnosis: draft.diagnosis?.map((d, j) =>
                          j === i ? { ...d, icd10_hint: e.target.value || null } : d,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() =>
                      patchDraft({
                        diagnosis: draft.diagnosis?.filter((_, j) => j !== i),
                      })
                    }
                    aria-label="Remove diagnosis"
                  >
                    <X size={15} />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                className="note-add-btn"
                onClick={() =>
                  patchDraft({
                    diagnosis: [
                      ...(draft.diagnosis ?? []),
                      { condition: "", certainty: null, icd10_hint: null },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add diagnosis
              </Button>
            </div>
          ) : (view.diagnosis?.length ?? 0) === 0 ? (
            <p className="nsec__empty">No diagnosis captured.</p>
          ) : (
            <div>
              {view.diagnosis?.map((dx, i) => (
                <div className="dx-row" key={i}>
                  <span className="dx-row__cond">{dx.condition}</span>
                  {dx.certainty && (
                    <Badge tone={dx.certainty === "confirmed" ? "ok" : "accent"}>
                      {dx.certainty}
                    </Badge>
                  )}
                  {dx.icd10_hint && <span className="dx-row__icd">{dx.icd10_hint}</span>}
                </div>
              ))}
            </div>
          )}
        </NSec>

        {/* ---------- prescriptions ---------- */}
        <NSec
          icon={<Pill size={16} />}
          title="Prescriptions"
          tone="accent"
          count={view.prescriptions?.length}
          span={12}
        >
          {editing && draft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(draft.prescriptions ?? []).map((rx, i) => (
                <div className="note-edit-grid" key={i}>
                  <input
                    className="ui-field__input"
                    value={rx.drug}
                    placeholder="Drug"
                    onChange={(e) =>
                      patchDraft({
                        prescriptions: draft.prescriptions?.map((p, j) =>
                          j === i ? { ...p, drug: e.target.value } : p,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={rx.dose ?? ""}
                    placeholder="Dose"
                    onChange={(e) =>
                      patchDraft({
                        prescriptions: draft.prescriptions?.map((p, j) =>
                          j === i ? { ...p, dose: e.target.value || null } : p,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={rx.frequency ?? ""}
                    placeholder="Frequency"
                    onChange={(e) =>
                      patchDraft({
                        prescriptions: draft.prescriptions?.map((p, j) =>
                          j === i ? { ...p, frequency: e.target.value || null } : p,
                        ),
                      })
                    }
                  />
                  <input
                    className="ui-field__input"
                    value={rx.duration ?? ""}
                    placeholder="Duration"
                    onChange={(e) =>
                      patchDraft({
                        prescriptions: draft.prescriptions?.map((p, j) =>
                          j === i ? { ...p, duration: e.target.value || null } : p,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() =>
                      patchDraft({
                        prescriptions: draft.prescriptions?.filter((_, j) => j !== i),
                      })
                    }
                    aria-label="Remove prescription"
                  >
                    <X size={15} />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                className="note-add-btn"
                onClick={() =>
                  patchDraft({
                    prescriptions: [
                      ...(draft.prescriptions ?? []),
                      { drug: "", dose: null, frequency: null, duration: null },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add prescription
              </Button>
            </div>
          ) : (view.prescriptions?.length ?? 0) === 0 ? (
            <p className="nsec__empty">No prescriptions captured.</p>
          ) : (
            <div className="rx-table-wrap">
              <table className="rx-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }} aria-label="No." />
                    <th>Drug</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {view.prescriptions?.map((rx, i) => (
                    <tr key={i}>
                      <td>
                        <span className="rx-num">{i + 1}</span>
                      </td>
                      <td className="rx-table__drug">{rx.drug}</td>
                      <td>{rx.dose ?? "—"}</td>
                      <td>{rx.frequency ?? "—"}</td>
                      <td>{rx.duration ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NSec>

        {/* ---------- row: tests + advice + (follow-up when editing) ---------- */}
        <NSec
          icon={<FlaskConical size={16} />}
          title="Tests ordered"
          tone="info"
          count={view.tests_ordered?.length}
          span={4}
        >
          {editing && draft ? (
            <ChipEditor
              items={draft.tests_ordered ?? []}
              onChange={(tests_ordered) => patchDraft({ tests_ordered })}
              placeholder="Add a test…"
            />
          ) : !has.tests ? (
            <p className="nsec__empty">No tests were ordered.</p>
          ) : (
            <ul className="note-list">
              {view.tests_ordered?.map((test, i) => (
                <li key={i}>{test}</li>
              ))}
            </ul>
          )}
        </NSec>

        {/* ---------- advice ---------- */}
        <NSec
          icon={<Lightbulb size={16} />}
          title="Advice"
          count={view.advice?.length}
          span={4}
        >
          {editing && draft ? (
            <ChipEditor
              items={draft.advice ?? []}
              onChange={(advice) => patchDraft({ advice })}
              placeholder="Add advice…"
            />
          ) : !has.advice ? (
            <p className="nsec__empty">No advice was recorded.</p>
          ) : (
            <ul className="note-list">
              {view.advice?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </NSec>

        {/* ---------- follow-up (edit only — the date lives in the header) ---------- */}
        {editing && draft && (
          <NSec icon={<CalendarClock size={16} />} title="Follow-up" tone="info" span={4}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label className="ui-check">
                <input
                  type="checkbox"
                  checked={draft.follow_up?.required ?? false}
                  onChange={(e) =>
                    patchDraft({
                      follow_up: { ...draft.follow_up, required: e.target.checked },
                    })
                  }
                />
                <span>Follow-up required</span>
              </label>
              {draft.follow_up?.required && (
                <div
                  style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}
                >
                  <TextField
                    label="After (days)"
                    type="number"
                    min={1}
                    value={draft.follow_up?.after_days ?? ""}
                    onChange={(e) =>
                      patchDraft({
                        follow_up: {
                          ...draft.follow_up,
                          required: true,
                          after_days: e.target.value ? Number(e.target.value) : null,
                        },
                      })
                    }
                  />
                  <TextField
                    label="Reason"
                    value={draft.follow_up?.reason ?? ""}
                    onChange={(e) =>
                      patchDraft({
                        follow_up: {
                          ...draft.follow_up,
                          required: true,
                          reason: e.target.value || null,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          </NSec>
        )}

        {/* ---------- history ---------- */}
        {/* ---------- row: history + patient details + social ---------- */}
        <NSec icon={<History size={16} />} title="History" span={4}>
          {!editing && !has.history ? (
            <p className="nsec__empty">No relevant history was captured.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(
                [
                  ["Medical history", "medical"],
                  ["Current medications", "medications_current"],
                  ["Allergies", "allergies"],
                ] as const
              ).map(([label, key]) => {
                const items = view.history?.[key] ?? [];
                if (!editing && items.length === 0) return null;
                return (
                  <div key={key}>
                    <div className="kv-tile__k" style={{ marginBottom: 6 }}>
                      {label}
                    </div>
                    {editing && draft ? (
                      <ChipEditor
                        items={draft.history?.[key] ?? []}
                        onChange={(next) =>
                          patchDraft({ history: { ...draft.history, [key]: next } })
                        }
                        placeholder={`Add to ${label.toLowerCase()}…`}
                      />
                    ) : (
                      <ChipList items={items} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </NSec>

        {/* ---------- patient details ---------- */}
        <NSec icon={<User size={16} />} title="Patient details (from audio)" span={4}>
          {editing && draft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                <TextField
                  label="Name"
                  value={draft.patient?.name ?? ""}
                  onChange={(e) =>
                    patchDraft({
                      patient: { ...draft.patient, name: e.target.value || null },
                    })
                  }
                />
                <TextField
                  label="Age"
                  value={draft.patient?.age ?? ""}
                  onChange={(e) =>
                    patchDraft({
                      patient: { ...draft.patient, age: e.target.value || null },
                    })
                  }
                />
                <TextField
                  label="Gender"
                  value={draft.patient?.gender ?? ""}
                  onChange={(e) =>
                    patchDraft({
                      patient: { ...draft.patient, gender: e.target.value || null },
                    })
                  }
                />
              </div>
              <div className="kv-tile__k">Identifiers mentioned</div>
              <ChipEditor
                items={draft.patient?.identifiers_mentioned ?? []}
                onChange={(identifiers_mentioned) =>
                  patchDraft({ patient: { ...draft.patient, identifiers_mentioned } })
                }
                placeholder="Add an identifier…"
              />
            </div>
          ) : filledPatient.length === 0 ? (
            <p className="nsec__empty">Nothing was mentioned in the audio.</p>
          ) : (
            <div>
              {filledPatient.map((row) => (
                <IRow
                  key={row.label}
                  icon={row.icon}
                  label={row.label}
                  value={row.value!}
                />
              ))}
            </div>
          )}
        </NSec>

        {/* ---------- social & lifestyle ---------- */}
        <NSec
          icon={<Home size={16} />}
          title="Social & lifestyle"
          tone="accent"
          count={filledSocial.length}
          span={4}
        >
          {editing && draft ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
              }}
            >
              <TextField
                label="Residence"
                value={draft.social_history?.residence ?? ""}
                onChange={(e) => patchSocial({ residence: e.target.value || null })}
              />
              <TextField
                label="Occupation"
                value={draft.social_history?.occupation ?? ""}
                onChange={(e) => patchSocial({ occupation: e.target.value || null })}
              />
              <TextField
                label="Family"
                value={draft.social_history?.family_details ?? ""}
                onChange={(e) => patchSocial({ family_details: e.target.value || null })}
              />
              <TextField
                label="Marital status"
                value={draft.social_history?.marital_status ?? ""}
                onChange={(e) => patchSocial({ marital_status: e.target.value || null })}
              />
              {(
                [
                  ["Smoking", "smoking"],
                  ["Alcohol", "alcohol"],
                  ["Recreational drugs", "recreational_drugs"],
                ] as const
              ).map(([label, key]) => (
                <div
                  key={key}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <SelectField
                    label={label}
                    value={draft.social_history?.[key]?.status ?? ""}
                    onChange={(e) =>
                      patchSubstance(key, { status: e.target.value || null })
                    }
                  >
                    <option value="">—</option>
                    {SUBSTANCE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    label="Detail"
                    value={draft.social_history?.[key]?.detail ?? ""}
                    placeholder="frequency / amount"
                    onChange={(e) =>
                      patchSubstance(key, { detail: e.target.value || null })
                    }
                  />
                </div>
              ))}
              <TextField
                label="Exercise"
                value={draft.social_history?.exercise ?? ""}
                onChange={(e) => patchSocial({ exercise: e.target.value || null })}
              />
              <TextField
                label="Diet"
                value={draft.social_history?.diet ?? ""}
                onChange={(e) => patchSocial({ diet: e.target.value || null })}
              />
              <TextField
                label="Commute"
                value={draft.social_history?.commute ?? ""}
                onChange={(e) => patchSocial({ commute: e.target.value || null })}
              />
              <TextField
                label="Mental health"
                value={draft.social_history?.mental_health ?? ""}
                onChange={(e) => patchSocial({ mental_health: e.target.value || null })}
              />
            </div>
          ) : filledSocial.length === 0 ? (
            <p className="nsec__empty">Nothing was discussed in this consultation.</p>
          ) : (
            <div>
              {filledSocial.map((row) => (
                <IRow
                  key={row.label}
                  icon={row.icon}
                  label={row.label}
                  value={row.value!}
                />
              ))}
            </div>
          )}
        </NSec>

        {/* ---------- additional / custom notes ---------- */}
        <NSec
          icon={<NotebookPen size={16} />}
          title="Additional notes"
          count={sh.other?.length}
          span={12}
        >
          {editing && draft ? (
            <>
              <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
                Anything else worth keeping on record — free-form, your words.
              </p>
              <ChipEditor
                items={draft.social_history?.other ?? []}
                onChange={(other) => patchSocial({ other })}
                placeholder="Add a custom note…"
              />
            </>
          ) : (sh.other?.length ?? 0) === 0 ? (
            <p className="nsec__empty">
              No additional notes — use <strong>Edit note</strong> to add your own.
            </p>
          ) : (
            <ul className="note-list">
              {sh.other?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </NSec>

        {/* ---------- unclear segments ---------- */}
        <NSec
          icon={<ClipboardList size={16} />}
          title="Unclear — please verify"
          tone="accent"
          tint={has.unclear ? "saffron" : undefined}
          count={view.unclear_segments?.length}
          span={12}
        >
          {has.unclear ? (
            view.unclear_segments?.map((segment, i) => (
              <div className="unclear" key={i}>
                “{segment}”
              </div>
            ))
          ) : (
            <p className="nsec__empty">
              Nothing was flagged as unclear — the AI was confident about what it heard.
            </p>
          )}
        </NSec>
      </div>

      <Modal
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        title="Finalize this note?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setFinalizeOpen(false)}
              disabled={finalizing}
            >
              Keep as draft
            </Button>
            <Button
              variant="primary"
              loading={finalizing}
              onClick={() => void handleFinalize()}
            >
              <BadgeCheck size={16} /> Finalize note
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--ink-2)", fontSize: "0.93rem" }}>
          Finalizing marks <strong>version {record.version}</strong> as the official
          record for this consultation and locks it from further edits. Signed off as{" "}
          <strong>{doctor?.full_name}</strong>.
        </p>
      </Modal>
    </div>
  );
}
