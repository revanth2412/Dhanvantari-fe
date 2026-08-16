/** Builds a clean plain-text rendering of a ClinicalNote (for copy/EMR paste). */
import type { ClinicalNote } from "@/types/record";

export function buildNoteText(note: ClinicalNote, patientName?: string | null): string {
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push("CLINICAL NOTE");
  if (patientName) push(`Patient: ${patientName}`);
  const p = note.patient;
  if (p && (p.age || p.gender)) {
    push(`Profile: ${[p.age, p.gender].filter(Boolean).join(", ")}`);
  }
  if (p?.identifiers_mentioned?.length) {
    push(`Identifiers mentioned: ${p.identifiers_mentioned.join(", ")}`);
  }
  push();

  if (note.chief_complaint) {
    push(`CHIEF COMPLAINT`);
    push(note.chief_complaint);
    push();
  }

  if (note.symptoms?.length) {
    push("SYMPTOMS");
    for (const s of note.symptoms) {
      const extra = [s.duration, s.severity, s.notes].filter(Boolean).join("; ");
      push(`- ${s.name}${extra ? ` (${extra})` : ""}`);
    }
    push();
  }

  const h = note.history;
  if (h && (h.medical?.length || h.medications_current?.length || h.allergies?.length)) {
    push("HISTORY");
    if (h.medical?.length) push(`Medical: ${h.medical.join(", ")}`);
    if (h.medications_current?.length)
      push(`Current medications: ${h.medications_current.join(", ")}`);
    if (h.allergies?.length) push(`Allergies: ${h.allergies.join(", ")}`);
    push();
  }

  if (note.vitals_mentioned?.length) {
    push("VITALS (as mentioned)");
    for (const v of note.vitals_mentioned) push(`- ${v.type}: ${v.value}`);
    push();
  }

  if (note.diagnosis?.length) {
    push("DIAGNOSIS");
    for (const d of note.diagnosis) {
      const extra = [d.certainty, d.icd10_hint].filter(Boolean).join(", ");
      push(`- ${d.condition}${extra ? ` (${extra})` : ""}`);
    }
    push();
  }

  if (note.prescriptions?.length) {
    push("PRESCRIPTIONS");
    note.prescriptions.forEach((rx, i) => {
      const extra = [rx.dose, rx.frequency, rx.duration].filter(Boolean).join(" · ");
      push(`${i + 1}. ${rx.drug}${extra ? ` — ${extra}` : ""}`);
    });
    push();
  }

  if (note.tests_ordered?.length) {
    push("TESTS ORDERED");
    for (const t of note.tests_ordered) push(`- ${t}`);
    push();
  }

  if (note.advice?.length) {
    push("ADVICE");
    for (const a of note.advice) push(`- ${a}`);
    push();
  }

  const f = note.follow_up;
  if (f?.required) {
    push("FOLLOW-UP");
    push(
      `${f.after_days ? `After ${f.after_days} day${f.after_days === 1 ? "" : "s"}` : "Required"}${
        f.reason ? ` — ${f.reason}` : ""
      }`,
    );
    push();
  }

  if (note.red_flags?.length) {
    push("RED FLAGS");
    for (const r of note.red_flags) push(`! ${r}`);
    push();
  }

  const sh = note.social_history;
  if (sh) {
    const substance = (s?: { status?: string | null; detail?: string | null }) =>
      s?.status || s?.detail ? [s.status, s.detail].filter(Boolean).join(" — ") : null;
    const rows: Array<[string, string | null | undefined]> = [
      ["Residence", sh.residence],
      ["Occupation", sh.occupation],
      ["Family", sh.family_details],
      ["Marital status", sh.marital_status],
      ["Smoking", substance(sh.smoking)],
      ["Alcohol", substance(sh.alcohol)],
      ["Recreational drugs", substance(sh.recreational_drugs)],
      ["Exercise", sh.exercise],
      ["Diet", sh.diet],
      ["Commute", sh.commute],
      ["Mental health", sh.mental_health],
    ];
    const filled = rows.filter(([, v]) => v);
    if (filled.length) {
      push("SOCIAL & LIFESTYLE");
      for (const [k, v] of filled) push(`${k}: ${v}`);
      push();
    }
    if (sh.other?.length) {
      push("ADDITIONAL NOTES");
      for (const o of sh.other) push(`- ${o}`);
      push();
    }
  }

  return lines.join("\n").trim();
}

/** Builds a structured ICD-10 coded SOAP (Subjective, Objective, Assessment, Plan) plain-text note. */
export function buildSoapNoteText(
  note: ClinicalNote,
  patientName?: string | null,
): string {
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push("CLINICAL SOAP NOTE (ICD-10 CODED)");
  if (patientName) push(`Patient: ${patientName}`);
  const p = note.patient;
  if (p && (p.age || p.gender)) {
    push(`Demographics: ${[p.age, p.gender].filter(Boolean).join(", ")}`);
  }
  push();

  // S - Subjective
  push("S — SUBJECTIVE");
  push("--------------");
  if (note.chief_complaint) {
    push(`Chief Complaint: ${note.chief_complaint}`);
  }
  if (note.symptoms?.length) {
    push("History of Present Illness:");
    for (const s of note.symptoms) {
      const extra = [
        s.duration ? `Duration: ${s.duration}` : null,
        s.severity ? `Severity: ${s.severity}` : null,
        s.notes,
      ]
        .filter(Boolean)
        .join(" · ");
      push(`  • ${s.name}${extra ? ` (${extra})` : ""}`);
    }
  }
  const h = note.history;
  if (h && (h.medical?.length || h.medications_current?.length || h.allergies?.length)) {
    if (h.medical?.length) push(`Past Medical History: ${h.medical.join(", ")}`);
    if (h.medications_current?.length)
      push(`Current Medications: ${h.medications_current.join(", ")}`);
    if (h.allergies?.length) push(`Allergies: ${h.allergies.join(", ")}`);
  }
  const sh = note.social_history;
  if (sh) {
    const substance = (s?: { status?: string | null; detail?: string | null }) =>
      s?.status || s?.detail ? [s.status, s.detail].filter(Boolean).join(" — ") : null;
    const soc = [
      sh.occupation ? `Occupation: ${sh.occupation}` : null,
      sh.residence ? `Residence: ${sh.residence}` : null,
      sh.smoking ? `Smoking: ${substance(sh.smoking)}` : null,
      sh.alcohol ? `Alcohol: ${substance(sh.alcohol)}` : null,
      sh.exercise ? `Exercise: ${sh.exercise}` : null,
      sh.diet ? `Diet: ${sh.diet}` : null,
    ].filter(Boolean);
    if (soc.length) push(`Social History: ${soc.join(" | ")}`);
  }
  push();

  // O - Objective
  push("O — OBJECTIVE");
  push("-------------");
  if (note.vitals_mentioned?.length) {
    push("Vital Signs & Telemetry:");
    for (const v of note.vitals_mentioned) {
      push(`  • ${v.type}: ${v.value}`);
    }
  } else {
    push("Vitals: Routine clinical examination");
  }
  push();

  // A - Assessment
  push("A — ASSESSMENT (ICD-10)");
  push("-----------------------");
  if (note.diagnosis?.length) {
    note.diagnosis.forEach((d, i) => {
      const code = d.icd10_hint ? ` [ICD-10: ${d.icd10_hint}]` : "";
      const cert = d.certainty ? ` (${d.certainty})` : "";
      push(`  ${i + 1}. ${d.condition}${code}${cert}`);
    });
  }
  if (note.red_flags?.length) {
    push("Red Flags / Alerts:");
    for (const r of note.red_flags) push(`  ! ${r}`);
  }
  push();

  // P - Plan
  push("P — PLAN");
  push("--------");
  if (note.prescriptions?.length) {
    push("Prescriptions (Rx):");
    note.prescriptions.forEach((rx, i) => {
      const extra = [rx.dose, rx.frequency, rx.duration].filter(Boolean).join(" · ");
      push(`  ${i + 1}. ${rx.drug}${extra ? ` — ${extra}` : ""}`);
    });
  }
  if (note.tests_ordered?.length) {
    push("Diagnostic Tests Ordered:");
    for (const t of note.tests_ordered) push(`  • ${t}`);
  }
  if (note.advice?.length) {
    push("Patient Advice & Lifestyle Recommendations:");
    for (const a of note.advice) push(`  • ${a}`);
  }
  const f = note.follow_up;
  if (f?.required) {
    push(
      `Follow-up: After ${f.after_days ?? "prescribed"} days${f.reason ? ` — ${f.reason}` : ""}`,
    );
  }
  if (note.unclear_segments?.length) {
    push("Ambiguities / Doctor Review:");
    for (const u of note.unclear_segments) push(`  ? ${u}`);
  }
  push();

  return lines.join("\n").trim();
}
