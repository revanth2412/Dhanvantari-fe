/**
 * SOAP rendering of a clinical note — Subjective, Objective, Assessment
 * (ICD-10 coded) and Plan, one tab each.
 *
 * It mounts the same editors as the grid view, so "Edit note" keeps the doctor
 * exactly where they were instead of throwing them into a different layout.
 */
import { useState, type ReactNode } from "react";
import {
  Activity,
  AlertOctagon,
  Brain,
  CalendarClock,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  History,
  Home,
  Lightbulb,
  MessageSquareQuote,
  NotebookPen,
  Pill,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import type { ClinicalNote } from "@/types/record";
import { Badge } from "@/components/ui/Badge";
import { ChipEditor, ChipList, IRow } from "@/components/note/NoteBits";
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
import type { NoteHas, NotePatchers } from "@/components/note/noteModel";

type SoapKey = "S" | "O" | "A" | "P";

interface SoapNoteViewProps extends NotePatchers {
  view: ClinicalNote;
  has: NoteHas;
  filledSocial: Array<{ icon: ReactNode; label: string; value: string | null }>;
  filledPatient: Array<{ icon: ReactNode; label: string; value: string | null }>;
  /** Present only in edit mode — when set, every pillar renders its editors. */
  draft: ClinicalNote | null;
}

function SoapBox({
  icon,
  label,
  count,
  tone,
  children,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  tone?: "danger" | "warn";
  children: ReactNode;
}) {
  return (
    <div className={`soap-section-box ${tone ? `soap-section-box--${tone}` : ""}`}>
      <span className="soap-section-label">
        {icon} {label}
        {count !== undefined && ` (${count})`}
      </span>
      {children}
    </div>
  );
}

export function SoapNoteView({
  view,
  has,
  filledSocial,
  filledPatient,
  draft,
  patch,
  patchSocial,
  patchSubstance,
}: SoapNoteViewProps) {
  const [activeTab, setActiveTab] = useState<SoapKey>("S");
  const sh = view.social_history ?? {};
  const followUp = view.follow_up;
  const editors = draft ? { draft, patch, patchSocial, patchSubstance } : null;

  const tabs: Array<{ key: SoapKey; name: string; short: string; count: number }> = [
    {
      key: "S",
      name: "Subjective",
      short: "Subjective",
      count: view.symptoms?.length ?? 0,
    },
    {
      key: "O",
      name: "Objective",
      short: "Objective",
      count: view.vitals_mentioned?.length ?? 0,
    },
    {
      key: "A",
      name: "Assessment (ICD-10)",
      short: "Assessment",
      count: view.diagnosis?.length ?? 0,
    },
    {
      key: "P",
      name: "Plan (Rx & Orders)",
      short: "Plan",
      count: (view.prescriptions?.length ?? 0) + (view.tests_ordered?.length ?? 0),
    },
  ];

  return (
    <div>
      {/* SOAP tabs — horizontally scrollable on a phone, never clipped. */}
      <div className="soap-tabs-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`soap-tab-btn soap-tab-btn--${tab.key.toLowerCase()} ${
              activeTab === tab.key ? "soap-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="soap-tab-pill">{tab.key}</span>
            <span className="soap-tab-name">{tab.name}</span>
            <span className="soap-tab-name soap-tab-name--short">{tab.short}</span>
            <span className="soap-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {editors && (
        <p className="soap-edit-hint">
          Editing in SOAP view — all four tabs share one draft and save together.
        </p>
      )}

      <div className="soap-tab-content" key={activeTab}>
        {/* ---------- S — Subjective ---------- */}
        {activeTab === "S" && (
          <article className="soap-pillar soap-pillar--s">
            <div className="soap-pillar__head">
              <div className="soap-pillar__title-wrap">
                <div className="soap-pillar__badge">S</div>
                <div>
                  <h3 className="soap-pillar__title">
                    Subjective — Patient Narrative &amp; Symptoms
                  </h3>
                  <span className="soap-pillar__sub">
                    Chief complaint, symptoms, prior history &amp; lifestyle
                  </span>
                </div>
              </div>
            </div>

            <div className="soap-pillar__body">
              <SoapBox icon={<MessageSquareQuote size={13} />} label="Chief Complaint">
                {editors ? (
                  <ChiefComplaintEditor {...editors} />
                ) : view.chief_complaint ? (
                  <div className="soap-quote-box">
                    &ldquo;{view.chief_complaint}&rdquo;
                  </div>
                ) : (
                  <p className="nsec__empty">No chief complaint recorded.</p>
                )}
              </SoapBox>

              <SoapBox
                icon={<Activity size={13} />}
                label="History of Present Illness"
                count={view.symptoms?.length ?? 0}
              >
                {editors ? (
                  <SymptomsEditor {...editors} />
                ) : (view.symptoms?.length ?? 0) === 0 ? (
                  <p className="nsec__empty">No specific symptoms recorded.</p>
                ) : (
                  <div className="soap-symptom-list">
                    {view.symptoms?.map((s, i) => (
                      <div key={i} className="soap-symptom-item">
                        <div className="soap-symptom-header">
                          <strong>{s.name}</strong>
                          <div className="soap-symptom-tags">
                            {s.severity && <Badge tone="warn">{s.severity}</Badge>}
                            {s.duration && <Badge tone="neutral">{s.duration}</Badge>}
                          </div>
                        </div>
                        {s.notes && <span className="soap-symptom-note">{s.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </SoapBox>

              <SoapBox icon={<History size={13} />} label="Past History &amp; Allergies">
                {editors ? (
                  <HistoryEditor {...editors} />
                ) : (
                  <>
                    {(view.history?.allergies?.length ?? 0) > 0 && (
                      <div className="soap-subgroup">
                        <strong className="soap-subgroup__k soap-subgroup__k--danger">
                          Known allergies
                        </strong>
                        <div className="onb-chips">
                          {view.history?.allergies?.map((a, i) => (
                            <span
                              key={i}
                              className="ui-chip ui-chip--static ui-chip--danger"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(view.history?.medical?.length ?? 0) > 0 && (
                      <div className="soap-subgroup">
                        <strong className="soap-subgroup__k">Past medical history</strong>
                        <ChipList items={view.history?.medical ?? []} />
                      </div>
                    )}
                    {(view.history?.medications_current?.length ?? 0) > 0 && (
                      <div className="soap-subgroup">
                        <strong className="soap-subgroup__k">Current medications</strong>
                        <ChipList items={view.history?.medications_current ?? []} />
                      </div>
                    )}
                    {!has.history && (
                      <p className="nsec__empty">
                        No prior medical history or allergies mentioned.
                      </p>
                    )}
                  </>
                )}
              </SoapBox>

              <SoapBox icon={<Home size={13} />} label="Social &amp; Lifestyle">
                {editors ? (
                  <SocialEditor {...editors} />
                ) : filledSocial.length === 0 ? (
                  <p className="nsec__empty">
                    Nothing was discussed in this consultation.
                  </p>
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
              </SoapBox>

              <SoapBox
                icon={<User size={13} />}
                label="Patient Identity (Heard in Audio)"
              >
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
              </SoapBox>
            </div>
          </article>
        )}

        {/* ---------- O — Objective ---------- */}
        {activeTab === "O" && (
          <article className="soap-pillar soap-pillar--o">
            <div className="soap-pillar__head">
              <div className="soap-pillar__title-wrap">
                <div className="soap-pillar__badge">O</div>
                <div>
                  <h3 className="soap-pillar__title">
                    Objective — Clinical Telemetry &amp; Vitals
                  </h3>
                  <span className="soap-pillar__sub">
                    Vitals, clinical telemetry &amp; physical examination
                  </span>
                </div>
              </div>
            </div>

            <div className="soap-pillar__body">
              <SoapBox
                icon={<HeartPulse size={13} />}
                label="Vital Signs"
                count={view.vitals_mentioned?.length ?? 0}
              >
                {editors ? (
                  <VitalsEditor {...editors} />
                ) : (view.vitals_mentioned?.length ?? 0) === 0 ? (
                  <p className="nsec__empty">No vitals captured during consultation.</p>
                ) : (
                  <div className="soap-vitals-grid">
                    {view.vitals_mentioned?.map((v, i) => (
                      <div key={i} className="soap-vital-pill">
                        <span className="soap-vital-label">{v.type}</span>
                        <span className="soap-vital-value">{v.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </SoapBox>

              <SoapBox
                icon={<Stethoscope size={13} />}
                label="Clinical Examination &amp; Measurements"
              >
                <p className="soap-note-text">
                  Continuous ambient telemetry active. All reported vital parameters,
                  physical signs, and clinical measurements are structured and
                  standardized into the clinical note.
                </p>
              </SoapBox>
            </div>
          </article>
        )}

        {/* ---------- A — Assessment ---------- */}
        {activeTab === "A" && (
          <article className="soap-pillar soap-pillar--a">
            <div className="soap-pillar__head">
              <div className="soap-pillar__title-wrap">
                <div className="soap-pillar__badge">A</div>
                <div>
                  <h3 className="soap-pillar__title">
                    Assessment — ICD-10 Diagnostic Classifications
                  </h3>
                  <span className="soap-pillar__sub">
                    Diagnoses, ICD-10 coding &amp; clinical certainty
                  </span>
                </div>
              </div>
            </div>

            <div className="soap-pillar__body">
              {(editors || has.redFlags) && (
                <SoapBox
                  icon={<AlertOctagon size={13} />}
                  label="Red Flags / Warning Signs"
                  count={view.red_flags?.length ?? 0}
                  tone="danger"
                >
                  {editors ? (
                    <ChipEditor
                      items={editors.draft.red_flags ?? []}
                      onChange={(red_flags) => patch({ red_flags })}
                      placeholder="Add a red flag…"
                    />
                  ) : (
                    view.red_flags?.map((flag, i) => (
                      <div className="redflag" key={i}>
                        <AlertOctagon size={15} className="redflag__icon" />
                        {flag}
                      </div>
                    ))
                  )}
                </SoapBox>
              )}

              <SoapBox
                icon={<Brain size={13} />}
                label="Coded Diagnoses"
                count={view.diagnosis?.length ?? 0}
              >
                {editors ? (
                  <DiagnosisEditor {...editors} />
                ) : (view.diagnosis?.length ?? 0) === 0 ? (
                  <p className="nsec__empty">No specific diagnosis extracted.</p>
                ) : (
                  <div className="soap-icd10-list">
                    {view.diagnosis?.map((d, i) => (
                      <div key={i} className="soap-icd10-card">
                        <div>
                          <strong className="soap-icd10-name">{d.condition}</strong>
                          {d.certainty && (
                            <div style={{ marginTop: 4 }}>
                              <Badge
                                tone={
                                  d.certainty.toLowerCase().includes("confirm")
                                    ? "ok"
                                    : "warn"
                                }
                              >
                                {d.certainty}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="soap-icd10-code-badge">
                          <Sparkles size={11} />
                          <span>{d.icd10_hint || "ICD-10 Coded"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SoapBox>
            </div>
          </article>
        )}

        {/* ---------- P — Plan ---------- */}
        {activeTab === "P" && (
          <article className="soap-pillar soap-pillar--p">
            <div className="soap-pillar__head">
              <div className="soap-pillar__title-wrap">
                <div className="soap-pillar__badge">P</div>
                <div>
                  <h3 className="soap-pillar__title">
                    Plan — Prescriptions, Diagnostics &amp; Follow-up
                  </h3>
                  <span className="soap-pillar__sub">
                    Therapeutics, ordered tests, lifestyle instructions &amp; return
                    schedule
                  </span>
                </div>
              </div>
            </div>

            <div className="soap-pillar__body">
              <SoapBox
                icon={<Pill size={13} />}
                label="Prescriptions / Rx"
                count={view.prescriptions?.length ?? 0}
              >
                {editors ? (
                  <PrescriptionsEditor {...editors} />
                ) : (view.prescriptions?.length ?? 0) === 0 ? (
                  <p className="nsec__empty">No medications prescribed.</p>
                ) : (
                  <div className="soap-rx-list">
                    {view.prescriptions?.map((rx, i) => (
                      <div key={i} className="soap-rx-pill">
                        <span className="soap-rx-name">{rx.drug}</span>
                        <div className="soap-rx-chips">
                          {rx.dose && <span className="soap-rx-tag">{rx.dose}</span>}
                          {rx.frequency && (
                            <span className="soap-rx-tag">{rx.frequency}</span>
                          )}
                          {rx.duration && (
                            <span className="soap-rx-tag">{rx.duration}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SoapBox>

              <SoapBox
                icon={<FlaskConical size={13} />}
                label="Investigations &amp; Labs"
                count={view.tests_ordered?.length ?? 0}
              >
                {editors ? (
                  <ChipEditor
                    items={editors.draft.tests_ordered ?? []}
                    onChange={(tests_ordered) => patch({ tests_ordered })}
                    placeholder="Add a test…"
                  />
                ) : has.tests ? (
                  <ChipList items={view.tests_ordered ?? []} />
                ) : (
                  <p className="nsec__empty">No investigations ordered.</p>
                )}
              </SoapBox>

              <SoapBox
                icon={<Lightbulb size={13} />}
                label="Patient Advice &amp; Instructions"
                count={view.advice?.length ?? 0}
              >
                {editors ? (
                  <ChipEditor
                    items={editors.draft.advice ?? []}
                    onChange={(advice) => patch({ advice })}
                    placeholder="Add advice…"
                  />
                ) : has.advice ? (
                  <ul className="note-list">
                    {view.advice?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="nsec__empty">No specific advice recorded.</p>
                )}
              </SoapBox>

              <SoapBox icon={<CalendarClock size={13} />} label="Follow-up Schedule">
                {editors ? (
                  <FollowUpEditor {...editors} />
                ) : followUp?.required ? (
                  <div className="soap-followup">
                    <strong>Return in {followUp.after_days ?? "prescribed"} days</strong>
                    {followUp.reason && <span> — {followUp.reason}</span>}
                  </div>
                ) : (
                  <p className="nsec__empty">No follow-up required.</p>
                )}
              </SoapBox>

              <SoapBox icon={<NotebookPen size={13} />} label="Additional Notes">
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
              </SoapBox>

              {has.unclear && (
                <SoapBox
                  icon={<ClipboardList size={13} />}
                  label="Doctor Verification Needed"
                  tone="warn"
                >
                  {view.unclear_segments?.map((segment, i) => (
                    <div className="unclear" key={i}>
                      &ldquo;{segment}&rdquo;
                    </div>
                  ))}
                </SoapBox>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
