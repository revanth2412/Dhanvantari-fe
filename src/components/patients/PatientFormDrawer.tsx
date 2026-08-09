import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createPatient, updatePatient } from "@/services/patientService";
import type { Patient, PatientCreateInput } from "@/types/patient";
import { Button } from "@/components/ui/Button";
import { CheckField, SelectField, TextField } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";

interface PatientFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When set, the drawer edits this patient instead of creating one. */
  patient?: Patient | null;
  onSaved: (patient: Patient) => void;
}

interface FormState {
  full_name: string;
  phone: string;
  dob: string;
  gender: string;
  language_pref: string;
  do_not_call: boolean;
  occupation: string;
  residence: string;
  marital_status: string;
  smoking_status: string;
  alcohol_status: string;
  exercise: string;
  diet: string;
}

const EMPTY: FormState = {
  full_name: "",
  phone: "",
  dob: "",
  gender: "",
  language_pref: "",
  do_not_call: false,
  occupation: "",
  residence: "",
  marital_status: "",
  smoking_status: "",
  alcohol_status: "",
  exercise: "",
  diet: "",
};

function fromPatient(patient: Patient): FormState {
  const sh = patient.social_history ?? {};
  return {
    full_name: patient.full_name,
    phone: patient.phone ?? "",
    dob: patient.dob ?? "",
    gender: patient.gender ?? "",
    language_pref: patient.language_pref ?? "",
    do_not_call: patient.do_not_call,
    occupation: sh.occupation ?? "",
    residence: sh.residence ?? "",
    marital_status: sh.marital_status ?? "",
    smoking_status: sh.smoking?.status ?? "",
    alcohol_status: sh.alcohol?.status ?? "",
    exercise: sh.exercise ?? "",
    diet: sh.diet ?? "",
  };
}

function toPayload(form: FormState): PatientCreateInput {
  const opt = (v: string) => (v.trim() ? v.trim() : null);
  const social = {
    occupation: opt(form.occupation),
    residence: opt(form.residence),
    marital_status: opt(form.marital_status),
    smoking: { status: opt(form.smoking_status), detail: null },
    alcohol: { status: opt(form.alcohol_status), detail: null },
    exercise: opt(form.exercise),
    diet: opt(form.diet),
  };
  const hasSocial = Object.values(social).some((v) =>
    typeof v === "string" ? v : v && (v.status || v.detail),
  );
  return {
    full_name: form.full_name.trim(),
    phone: opt(form.phone),
    dob: opt(form.dob),
    gender: opt(form.gender),
    language_pref: opt(form.language_pref),
    do_not_call: form.do_not_call,
    social_history: hasSocial ? social : undefined,
  };
}

export function PatientFormDrawer({
  open,
  onClose,
  patient,
  onSaved,
}: PatientFormDrawerProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showLifestyle, setShowLifestyle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(patient);

  useEffect(() => {
    if (open) {
      setForm(patient ? fromPatient(patient) : EMPTY);
      setShowLifestyle(false);
      setError(null);
    }
  }, [open, patient]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    if (form.full_name.trim().length < 2) {
      setError("Patient name is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = toPayload(form);
      const saved = patient
        ? await updatePatient(patient.id, payload)
        : await createPatient(payload);
      toast({
        kind: "success",
        title: editing ? "Patient updated" : "Patient added",
        message: saved.full_name,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the patient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Edit patient" : "Add patient"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
            {editing ? "Save changes" : "Add patient"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField
          label="Full name"
          required
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="Patient's full name"
          autoFocus
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91…"
          />
          <TextField
            label="Date of birth"
            type="date"
            value={form.dob}
            onChange={(e) => set("dob", e.target.value)}
          />
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </SelectField>
          <TextField
            label="Preferred language"
            value={form.language_pref}
            onChange={(e) => set("language_pref", e.target.value)}
            placeholder="e.g. Telugu"
          />
        </div>
        <CheckField
          label="Do not call — exclude from phone follow-ups"
          checked={form.do_not_call}
          onChange={(e) => set("do_not_call", e.target.checked)}
        />

        <button
          type="button"
          className="ui-btn ui-btn--ghost"
          style={{ justifyContent: "space-between" }}
          onClick={() => setShowLifestyle((v) => !v)}
        >
          Lifestyle &amp; social history (optional)
          <ChevronDown
            size={16}
            style={{
              transition: "transform 200ms var(--ease-out)",
              transform: showLifestyle ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {showLifestyle && (
          <div
            className="onb-pane"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <TextField
              label="Occupation"
              value={form.occupation}
              onChange={(e) => set("occupation", e.target.value)}
            />
            <TextField
              label="Residence"
              value={form.residence}
              onChange={(e) => set("residence", e.target.value)}
            />
            <SelectField
              label="Marital status"
              value={form.marital_status}
              onChange={(e) => set("marital_status", e.target.value)}
            >
              <option value="">—</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </SelectField>
            <SelectField
              label="Smoking"
              value={form.smoking_status}
              onChange={(e) => set("smoking_status", e.target.value)}
            >
              <option value="">—</option>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="occasional">Occasional</option>
              <option value="current">Current</option>
            </SelectField>
            <SelectField
              label="Alcohol"
              value={form.alcohol_status}
              onChange={(e) => set("alcohol_status", e.target.value)}
            >
              <option value="">—</option>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="occasional">Occasional</option>
              <option value="current">Current</option>
            </SelectField>
            <TextField
              label="Exercise"
              value={form.exercise}
              onChange={(e) => set("exercise", e.target.value)}
              placeholder="e.g. walks daily"
            />
            <TextField
              label="Diet"
              value={form.diet}
              onChange={(e) => set("diet", e.target.value)}
              placeholder="e.g. vegetarian"
            />
          </div>
        )}

        {error && <p className="ui-field__error">{error}</p>}
        <p className="ui-field__hint">
          Anything you enter here is doctor-verified and will never be overwritten by
          AI-extracted consultation data.
        </p>
      </div>
    </Drawer>
  );
}
