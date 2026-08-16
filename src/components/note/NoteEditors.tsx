/**
 * Field editors for the clinical note.
 *
 * Both renderings of a note — the 12-column grid and the SOAP pillars — mount
 * these same blocks, so "Edit note" behaves identically whichever view the
 * doctor is in, and there is exactly one implementation to keep correct.
 *
 * Every repeating row uses `EditItem`, whose field track auto-fits: four inputs
 * side by side on a desktop, stacked full-width on a phone.
 */
import type { ReactNode } from "react";
import { Plus, X, type LucideIcon } from "lucide-react";
import type { ClinicalNote } from "@/types/record";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ChipEditor } from "@/components/note/NoteBits";
import {
  HISTORY_KEYS,
  SUBSTANCE_KEYS,
  SUBSTANCE_OPTIONS,
  type NotePatchers,
} from "@/components/note/noteModel";

interface EditorProps extends NotePatchers {
  draft: ClinicalNote;
}

function EditItem({
  onRemove,
  removeLabel,
  children,
}: {
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="nedit">
      <div className="nedit__fields">{children}</div>
      <Button
        variant="ghost"
        iconOnly
        className="nedit__x"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <X size={15} />
      </Button>
    </div>
  );
}

function AddButton({
  icon: Icon = Plus,
  label,
  onClick,
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button size="sm" className="note-add-btn" onClick={onClick}>
      <Icon size={14} /> {label}
    </Button>
  );
}

export function ChiefComplaintEditor({ draft, patch }: EditorProps) {
  return (
    <TextAreaField
      value={draft.chief_complaint ?? ""}
      onChange={(e) => patch({ chief_complaint: e.target.value || null })}
      placeholder="Primary reason for the visit"
      rows={2}
    />
  );
}

export function VitalsEditor({ draft, patch }: EditorProps) {
  const vitals = draft.vitals_mentioned ?? [];
  return (
    <div className="nedit-stack">
      {vitals.map((vital, i) => (
        <EditItem
          key={i}
          removeLabel="Remove vital"
          onRemove={() => patch({ vitals_mentioned: vitals.filter((_, j) => j !== i) })}
        >
          <input
            className="ui-field__input"
            value={vital.type}
            placeholder="Vital (e.g. BP)"
            onChange={(e) =>
              patch({
                vitals_mentioned: vitals.map((v, j) =>
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
              patch({
                vitals_mentioned: vitals.map((v, j) =>
                  j === i ? { ...v, value: e.target.value } : v,
                ),
              })
            }
          />
        </EditItem>
      ))}
      <AddButton
        label="Add vital"
        onClick={() => patch({ vitals_mentioned: [...vitals, { type: "", value: "" }] })}
      />
    </div>
  );
}

export function SymptomsEditor({ draft, patch }: EditorProps) {
  const symptoms = draft.symptoms ?? [];
  return (
    <div className="nedit-stack">
      {symptoms.map((symptom, i) => (
        <EditItem
          key={i}
          removeLabel="Remove symptom"
          onRemove={() => patch({ symptoms: symptoms.filter((_, j) => j !== i) })}
        >
          <input
            className="ui-field__input"
            value={symptom.name}
            placeholder="Symptom"
            onChange={(e) =>
              patch({
                symptoms: symptoms.map((s, j) =>
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
              patch({
                symptoms: symptoms.map((s, j) =>
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
              patch({
                symptoms: symptoms.map((s, j) =>
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
              patch({
                symptoms: symptoms.map((s, j) =>
                  j === i ? { ...s, notes: e.target.value || null } : s,
                ),
              })
            }
          />
        </EditItem>
      ))}
      <AddButton
        label="Add symptom"
        onClick={() =>
          patch({
            symptoms: [
              ...symptoms,
              { name: "", duration: null, severity: null, notes: null },
            ],
          })
        }
      />
    </div>
  );
}

export function DiagnosisEditor({ draft, patch }: EditorProps) {
  const diagnosis = draft.diagnosis ?? [];
  return (
    <div className="nedit-stack">
      {diagnosis.map((dx, i) => (
        <EditItem
          key={i}
          removeLabel="Remove diagnosis"
          onRemove={() => patch({ diagnosis: diagnosis.filter((_, j) => j !== i) })}
        >
          <input
            className="ui-field__input nedit__wide"
            value={dx.condition}
            placeholder="Condition"
            onChange={(e) =>
              patch({
                diagnosis: diagnosis.map((d, j) =>
                  j === i ? { ...d, condition: e.target.value } : d,
                ),
              })
            }
          />
          <select
            className="ui-field__input"
            value={dx.certainty ?? ""}
            aria-label="Certainty"
            onChange={(e) =>
              patch({
                diagnosis: diagnosis.map((d, j) =>
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
              patch({
                diagnosis: diagnosis.map((d, j) =>
                  j === i ? { ...d, icd10_hint: e.target.value || null } : d,
                ),
              })
            }
          />
        </EditItem>
      ))}
      <AddButton
        label="Add diagnosis"
        onClick={() =>
          patch({
            diagnosis: [
              ...diagnosis,
              { condition: "", certainty: null, icd10_hint: null },
            ],
          })
        }
      />
    </div>
  );
}

export function PrescriptionsEditor({ draft, patch }: EditorProps) {
  const prescriptions = draft.prescriptions ?? [];
  return (
    <div className="nedit-stack">
      {prescriptions.map((rx, i) => (
        <EditItem
          key={i}
          removeLabel="Remove prescription"
          onRemove={() =>
            patch({ prescriptions: prescriptions.filter((_, j) => j !== i) })
          }
        >
          <input
            className="ui-field__input nedit__wide"
            value={rx.drug}
            placeholder="Drug"
            onChange={(e) =>
              patch({
                prescriptions: prescriptions.map((p, j) =>
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
              patch({
                prescriptions: prescriptions.map((p, j) =>
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
              patch({
                prescriptions: prescriptions.map((p, j) =>
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
              patch({
                prescriptions: prescriptions.map((p, j) =>
                  j === i ? { ...p, duration: e.target.value || null } : p,
                ),
              })
            }
          />
        </EditItem>
      ))}
      <AddButton
        label="Add prescription"
        onClick={() =>
          patch({
            prescriptions: [
              ...prescriptions,
              { drug: "", dose: null, frequency: null, duration: null },
            ],
          })
        }
      />
    </div>
  );
}

export function FollowUpEditor({ draft, patch }: EditorProps) {
  const followUp = draft.follow_up;
  return (
    <div className="nedit-stack">
      <label className="ui-check">
        <input
          type="checkbox"
          checked={followUp?.required ?? false}
          onChange={(e) =>
            patch({ follow_up: { ...followUp, required: e.target.checked } })
          }
        />
        <span>Follow-up required</span>
      </label>
      {followUp?.required && (
        <div className="nedit__fields">
          <TextField
            label="After (days)"
            type="number"
            min={1}
            value={followUp?.after_days ?? ""}
            onChange={(e) =>
              patch({
                follow_up: {
                  ...followUp,
                  required: true,
                  after_days: e.target.value ? Number(e.target.value) : null,
                },
              })
            }
          />
          <TextField
            label="Reason"
            value={followUp?.reason ?? ""}
            onChange={(e) =>
              patch({
                follow_up: {
                  ...followUp,
                  required: true,
                  reason: e.target.value || null,
                },
              })
            }
          />
        </div>
      )}
    </div>
  );
}

export function HistoryEditor({ draft, patch }: EditorProps) {
  return (
    <div className="nedit-stack nedit-stack--roomy">
      {HISTORY_KEYS.map(([label, key]) => (
        <div key={key}>
          <div className="kv-tile__k" style={{ marginBottom: 6 }}>
            {label}
          </div>
          <ChipEditor
            items={draft.history?.[key] ?? []}
            onChange={(next) => patch({ history: { ...draft.history, [key]: next } })}
            placeholder={`Add to ${label.toLowerCase()}…`}
          />
        </div>
      ))}
    </div>
  );
}

export function PatientIdentityEditor({ draft, patch }: EditorProps) {
  return (
    <div className="nedit-stack">
      <div className="nedit__fields">
        <TextField
          label="Name"
          value={draft.patient?.name ?? ""}
          onChange={(e) =>
            patch({ patient: { ...draft.patient, name: e.target.value || null } })
          }
        />
        <TextField
          label="Age"
          value={draft.patient?.age ?? ""}
          onChange={(e) =>
            patch({ patient: { ...draft.patient, age: e.target.value || null } })
          }
        />
        <TextField
          label="Gender"
          value={draft.patient?.gender ?? ""}
          onChange={(e) =>
            patch({ patient: { ...draft.patient, gender: e.target.value || null } })
          }
        />
      </div>
      <div className="kv-tile__k">Identifiers mentioned</div>
      <ChipEditor
        items={draft.patient?.identifiers_mentioned ?? []}
        onChange={(identifiers_mentioned) =>
          patch({ patient: { ...draft.patient, identifiers_mentioned } })
        }
        placeholder="Add an identifier…"
      />
    </div>
  );
}

export function SocialEditor({ draft, patchSocial, patchSubstance }: EditorProps) {
  const sh = draft.social_history;
  return (
    <div className="nedit__fields nedit__fields--wide">
      <TextField
        label="Residence"
        value={sh?.residence ?? ""}
        onChange={(e) => patchSocial({ residence: e.target.value || null })}
      />
      <TextField
        label="Occupation"
        value={sh?.occupation ?? ""}
        onChange={(e) => patchSocial({ occupation: e.target.value || null })}
      />
      <TextField
        label="Family"
        value={sh?.family_details ?? ""}
        onChange={(e) => patchSocial({ family_details: e.target.value || null })}
      />
      <TextField
        label="Marital status"
        value={sh?.marital_status ?? ""}
        onChange={(e) => patchSocial({ marital_status: e.target.value || null })}
      />
      {SUBSTANCE_KEYS.map(([label, key]) => (
        <div key={key} className="nedit-stack">
          <SelectField
            label={label}
            value={sh?.[key]?.status ?? ""}
            onChange={(e) => patchSubstance(key, { status: e.target.value || null })}
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
            value={sh?.[key]?.detail ?? ""}
            placeholder="frequency / amount"
            onChange={(e) => patchSubstance(key, { detail: e.target.value || null })}
          />
        </div>
      ))}
      <TextField
        label="Exercise"
        value={sh?.exercise ?? ""}
        onChange={(e) => patchSocial({ exercise: e.target.value || null })}
      />
      <TextField
        label="Diet"
        value={sh?.diet ?? ""}
        onChange={(e) => patchSocial({ diet: e.target.value || null })}
      />
      <TextField
        label="Commute"
        value={sh?.commute ?? ""}
        onChange={(e) => patchSocial({ commute: e.target.value || null })}
      />
      <TextField
        label="Mental health"
        value={sh?.mental_health ?? ""}
        onChange={(e) => patchSocial({ mental_health: e.target.value || null })}
      />
    </div>
  );
}

export function AdditionalNotesEditor({ draft, patchSocial }: EditorProps) {
  return (
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
  );
}
