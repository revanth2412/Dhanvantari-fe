/**
 * Shared shape helpers for the clinical note. Kept free of JSX so both the
 * grid view and the SOAP view can rely on the same normalized draft.
 */
import type { SocialHistory, SubstanceUse } from "@/types/patient";
import type { ClinicalNote } from "@/types/record";

export const SUBSTANCE_OPTIONS = ["never", "former", "occasional", "current"];

function normalizeSubstance(s: SubstanceUse | undefined): SubstanceUse {
  return { status: s?.status ?? null, detail: s?.detail ?? null };
}

export function normalizeSocial(sh: SocialHistory | undefined): SocialHistory {
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
export function normalize(note: ClinicalNote): ClinicalNote {
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

export function substanceText(s: SubstanceUse | undefined): string | null {
  if (!s?.status && !s?.detail) return null;
  return [s.status, s.detail].filter(Boolean).join(" — ");
}

/** The three sub-lists of `history`, in the order doctors read them. */
export const HISTORY_KEYS = [
  ["Medical history", "medical"],
  ["Current medications", "medications_current"],
  ["Allergies", "allergies"],
] as const;

/** Substance-use rows, shared by the social editor in both views. */
export const SUBSTANCE_KEYS = [
  ["Smoking", "smoking"],
  ["Alcohol", "alcohol"],
  ["Recreational drugs", "recreational_drugs"],
] as const;

/** Which sections actually carry content — drives empty-state placeholders. */
export function noteHas(view: ClinicalNote) {
  return {
    redFlags: (view.red_flags?.length ?? 0) > 0,
    history:
      (view.history?.medical?.length ?? 0) > 0 ||
      (view.history?.medications_current?.length ?? 0) > 0 ||
      (view.history?.allergies?.length ?? 0) > 0,
    tests: (view.tests_ordered?.length ?? 0) > 0,
    advice: (view.advice?.length ?? 0) > 0,
    unclear: (view.unclear_segments?.length ?? 0) > 0,
  };
}

export type NoteHas = ReturnType<typeof noteHas>;

/** Mutation callbacks handed to every editor block. */
export interface NotePatchers {
  patch: (patch: Partial<ClinicalNote>) => void;
  patchSocial: (patch: Partial<SocialHistory>) => void;
  patchSubstance: (
    key: "smoking" | "alcohol" | "recreational_drugs",
    patch: Partial<SubstanceUse>,
  ) => void;
}
