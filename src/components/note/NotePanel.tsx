import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  AudioLines,
  BadgeCheck,
  Brain,
  BrainCircuit,
  Briefcase,
  Bus,
  Cake,
  CalendarClock,
  Check,
  Cigarette,
  ClipboardList,
  Copy,
  Dumbbell,
  FileQuestion,
  Fingerprint,
  FlaskConical,
  HeartHandshake,
  HeartPulse,
  History,
  Home,
  LayoutGrid,
  Leaf,
  Lightbulb,
  Lock,
  MessageSquareQuote,
  NotebookPen,
  Pencil,
  Pill,
  Stethoscope,
  Trash2,
  User,
  Users,
  Utensils,
  Wine,
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
import { buildNoteText, buildSoapNoteText } from "@/lib/noteText";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChipEditor,
  ChipList,
  ConfidenceRing,
  IRow,
  NSec,
  VitalIcon,
} from "@/components/note/NoteBits";
import {
  AdditionalNotesEditor,
  ChiefComplaintEditor,
  DiagnosisEditor,
  FollowUpEditor,
  HistoryEditor,
  PatientIdentityEditor,
  PrescriptionsEditor,
  SocialEditor,
  SymptomsEditor,
  VitalsEditor,
} from "@/components/note/NoteEditors";
import { SoapNoteView } from "@/components/note/SoapNoteView";
import { ConsultationProvenance } from "@/components/consultation/ConsultationProvenance";
import {
  HISTORY_KEYS,
  noteHas,
  normalize,
  substanceText,
  type NotePatchers,
} from "@/components/note/noteModel";

interface NotePanelProps {
  consultation: Consultation;
  /** Registered patient record — rendered in the merged header block. */
  patient?: Patient | null;
  patientName?: string | null;
  onBack: () => void;
  onShowTranscript: () => void;
  /** Omitted once the note is finalized — signed records can't be discarded. */
  onDiscard?: () => void;
  onFinalized: () => void;
}

export function NotePanel({
  consultation,
  patient,
  patientName,
  onBack,
  onShowTranscript,
  onDiscard,
  onFinalized,
}: NotePanelProps) {
  const { doctor } = useAuth();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<"soap" | "standard">("standard");
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

  const patchers: NotePatchers = useMemo(
    () => ({
      patch: (patch: Partial<ClinicalNote>) =>
        setDraft((prev) => (prev ? { ...prev, ...patch } : prev)),
      patchSocial: (patch: Partial<SocialHistory>) =>
        setDraft((prev) =>
          prev ? { ...prev, social_history: { ...prev.social_history, ...patch } } : prev,
        ),
      patchSubstance: (
        key: "smoking" | "alcohol" | "recreational_drugs",
        patch: Partial<SubstanceUse>,
      ) =>
        setDraft((prev) => {
          if (!prev) return prev;
          const social = { ...prev.social_history };
          social[key] = { ...social[key], ...patch };
          return { ...prev, social_history: social };
        }),
    }),
    [],
  );
  const { patch } = patchers;

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
      const textToCopy =
        viewMode === "soap"
          ? buildSoapNoteText(view, patient?.full_name ?? patientName)
          : buildNoteText(view, patient?.full_name ?? patientName);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      toast({
        kind: "success",
        title: viewMode === "soap" ? "SOAP Note Copied" : "Note Copied",
        message: "Formatted clinical note ready for EMR paste.",
      });
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
  const editors = editing && draft ? { draft, ...patchers } : null;

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
  const has = noteHas(view);

  // Follow-up is a header chip, not a section: the actual date, computed from
  // the note's "after N days" relative to the consultation.
  const fuDays = followUp?.required ? (followUp.after_days ?? null) : null;
  const fuDateIso = fuDays
    ? new Date(new Date(record.created_at).getTime() + fuDays * 86400000).toISOString()
    : null;

  const headerSub = [ageFromDob(patient?.dob), patient?.gender, patient?.phone]
    .filter(Boolean)
    .join(" · ");
  const headerVersion = `v${record.version} · ${formatDateTime(record.created_at)}`;

  /* The primary actions render twice — inside the toolbar on desktop, inside a
     thumb-reachable bottom bar on mobile. CSS decides which one is visible,
     the same way the sidebar and tab bar coexist. */
  function primaryActions() {
    if (isFinal) return null;
    if (editing) {
      return (
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
            <Check size={15} /> <span className="btn-label">Save new version</span>
            <span className="btn-label-short">Save</span>
          </Button>
        </>
      );
    }
    return (
      <>
        <Button size="sm" onClick={startEdit}>
          <Pencil size={14} /> <span className="btn-label">Edit note</span>
          <span className="btn-label-short">Edit</span>
        </Button>
        <Button size="sm" variant="primary" onClick={() => setFinalizeOpen(true)}>
          <BadgeCheck size={15} /> <span>Finalize</span>
        </Button>
      </>
    );
  }

  return (
    <div className={`note-shell ${editing ? "note-shell--editing" : ""}`}>
      {/* ---------- sticky toolbar ---------- */}
      <div className="ui-card note-topbar">
        <div className="note-toolbar__meta">
          <Button size="sm" variant="ghost" iconOnly onClick={onBack} aria-label="Back">
            <ArrowLeft size={16} />
          </Button>
          <Avatar name={patient?.full_name ?? patientName} size={36} />
          <div className="note-ident">
            <div className="note-ident__name">
              {patient?.full_name ?? patientName ?? "Clinical note"}
            </div>
            <div className="note-ident__sub">
              {headerSub && <span>{headerSub}</span>}
              <span className="note-ident__ver">{headerVersion}</span>
            </div>
          </div>
          <div className="note-ident__tags">
            <Badge tone={isFinal ? "ok" : "warn"} dot>
              {isFinal ? "Final" : "Draft"}
            </Badge>
            {followUp?.required && (
              <Badge tone="info">
                <CalendarClock size={11} /> Follow-up{" "}
                {fuDateIso ? `${formatDate(fuDateIso)} (in ${fuDays}d)` : "required"}
              </Badge>
            )}
          </div>
          <ConfidenceRing value={view.extraction_confidence ?? 0} />
        </div>

        <div className="note-toolbar__actions">
          {/* Both views are editable, so the switch stays available in edit mode. */}
          <div className="note-view-toggle">
            <button
              type="button"
              className={`note-view-toggle__btn ${viewMode === "soap" ? "note-view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("soap")}
              title="Clinical SOAP Note format (ICD-10 Coded)"
            >
              <BrainCircuit size={13} />
              <span>Clinical SOAP</span>
            </button>
            <button
              type="button"
              className={`note-view-toggle__btn ${viewMode === "standard" ? "note-view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("standard")}
              title="Standard Sections Grid"
            >
              <LayoutGrid size={13} />
              <span>Grid View</span>
            </button>
          </div>

          <div className="note-toolbar__ops">
            <Button
              size="sm"
              variant="ghost"
              onClick={onShowTranscript}
              title="Verbatim transcript"
              aria-label="Transcript"
            >
              <AudioLines size={14} /> <span className="btn-label">Transcript</span>
            </Button>
            <Button
              size="sm"
              onClick={() => void handleCopy()}
              title="Copy the note for EMR paste"
              aria-label="Copy note"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="btn-label">{copied ? "Copied" : "Copy"}</span>
            </Button>
            {!isFinal && !editing && onDiscard && (
              <Button
                size="sm"
                variant="danger-soft"
                onClick={onDiscard}
                title="Discard this consultation"
                aria-label="Discard consultation"
              >
                <Trash2 size={14} /> <span className="btn-label">Discard</span>
              </Button>
            )}
          </div>

          <div className="note-toolbar__primary">{primaryActions()}</div>
        </div>
      </div>

      {/* Care-team provenance: who conducted the visit, who signed the note. */}
      <ConsultationProvenance consultation={consultation} record={record} />

      {isFinal && (
        <div className="final-banner">
          <Lock size={17} />
          Finalized {record.finalized_at ? formatDateTime(record.finalized_at) : ""} —
          this record is locked and preserved.
        </div>
      )}

      {viewMode === "soap" ? (
        <SoapNoteView
          view={view}
          has={has}
          filledSocial={filledSocial}
          filledPatient={filledPatient}
          draft={editors ? editors.draft : null}
          {...patchers}
        />
      ) : (
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
            {editors ? (
              <ChipEditor
                items={editors.draft.red_flags ?? []}
                onChange={(red_flags) => patch({ red_flags })}
                placeholder="Add a red flag…"
              />
            ) : has.redFlags ? (
              view.red_flags?.map((flag, i) => (
                <div className="redflag" key={i}>
                  <AlertOctagon size={16} className="redflag__icon" />
                  {flag}
                </div>
              ))
            ) : (
              <p className="nsec__empty">None identified in this consultation.</p>
            )}
          </NSec>

          {/* ---------- row: chief complaint + vitals ---------- */}
          <NSec icon={<MessageSquareQuote size={16} />} title="Chief complaint" span={7}>
            {editors ? (
              <ChiefComplaintEditor {...editors} />
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
            {editors ? (
              <VitalsEditor {...editors} />
            ) : (view.vitals_mentioned?.length ?? 0) === 0 ? (
              <p className="nsec__empty">No vitals were mentioned.</p>
            ) : (
              <div className="vitals-wrap">
                {view.vitals_mentioned?.map((vital, i) => (
                  <span className="vital-chip" key={i}>
                    <VitalIcon type={vital.type} />
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
            {editors ? (
              <SymptomsEditor {...editors} />
            ) : (view.symptoms?.length ?? 0) === 0 ? (
              <p className="nsec__empty">No symptoms captured.</p>
            ) : (
              <div className="sym-grid">
                {view.symptoms?.map((symptom, i) => (
                  <div className="sym-card" key={i}>
                    <div className="sym-card__name">{symptom.name}</div>
                    <div className="sym-card__meta">
                      {symptom.duration && <Badge tone="info">{symptom.duration}</Badge>}
                      {symptom.severity && (
                        <Badge tone="accent">{symptom.severity}</Badge>
                      )}
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
            {editors ? (
              <DiagnosisEditor {...editors} />
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
                    {dx.icd10_hint && (
                      <span className="dx-row__icd">{dx.icd10_hint}</span>
                    )}
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
            {editors ? (
              <PrescriptionsEditor {...editors} />
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
            {editors ? (
              <ChipEditor
                items={editors.draft.tests_ordered ?? []}
                onChange={(tests_ordered) => patch({ tests_ordered })}
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
            {editors ? (
              <ChipEditor
                items={editors.draft.advice ?? []}
                onChange={(advice) => patch({ advice })}
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
          {editors && (
            <NSec
              icon={<CalendarClock size={16} />}
              title="Follow-up"
              tone="info"
              span={4}
            >
              <FollowUpEditor {...editors} />
            </NSec>
          )}

          {/* ---------- row: history + patient details + social ---------- */}
          <NSec icon={<History size={16} />} title="History" span={4}>
            {editors ? (
              <HistoryEditor {...editors} />
            ) : !has.history ? (
              <p className="nsec__empty">No relevant history was captured.</p>
            ) : (
              <div className="nedit-stack nedit-stack--roomy">
                {HISTORY_KEYS.map(([label, key]) => {
                  const items = view.history?.[key] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="kv-tile__k" style={{ marginBottom: 6 }}>
                        {label}
                      </div>
                      <ChipList items={items} />
                    </div>
                  );
                })}
              </div>
            )}
          </NSec>

          {/* ---------- patient details ---------- */}
          <NSec icon={<User size={16} />} title="Patient details (from audio)" span={4}>
            {editors ? (
              <PatientIdentityEditor {...editors} />
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
            {editors ? (
              <SocialEditor {...editors} />
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
            {editors ? (
              <AdditionalNotesEditor {...editors} />
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
                  &ldquo;{segment}&rdquo;
                </div>
              ))
            ) : (
              <p className="nsec__empty">
                Nothing was flagged as unclear — the AI was confident about what it heard.
              </p>
            )}
          </NSec>
        </div>
      )}

      {/* Mobile-only twin of the toolbar's primary actions: always within thumb
          reach, never pushed off the side of the viewport. */}
      {!isFinal && <div className="note-actionbar">{primaryActions()}</div>}

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
