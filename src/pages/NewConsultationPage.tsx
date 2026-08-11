import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Search, ShieldCheck, UserPlus } from "lucide-react";
import { searchPatients } from "@/services/patientService";
import { createConsultation } from "@/services/consultationService";
import { rememberSession } from "@/lib/recents";
import { ageFromDob } from "@/lib/format";
import type { Patient } from "@/types/patient";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { PatientFormDrawer } from "@/components/patients/PatientFormDrawer";
import { CaptureStage } from "@/components/consultation/CaptureStage";

/** Consent is confirmed once per patient at registration, not per visit, so the
 *  flow is just: pick the patient, then record. */
const STEPS = ["Patient", "Start consultation"] as const;

export function NewConsultationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor } = useAuth();
  const toast = useToast();

  const presetPatient = useMemo(
    () => (location.state as { patient?: Patient } | null)?.patient ?? null,
    [location.state],
  );

  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(presetPatient);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 280);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  // A consultation is a DB row — never create two for one intent (StrictMode
  // double-invokes effects in dev, and the pick handler can be double-tapped).
  const startedRef = useRef(false);

  const { data: results, loading: searching } = useCachedQuery<Patient[]>(
    `patients:list:${debouncedQuery.trim()}`,
    () => searchPatients(debouncedQuery),
    { enabled: step === 0 },
  );

  async function startSession(target: Patient) {
    if (!doctor || startedRef.current) return;
    startedRef.current = true;
    setPatient(target);
    setStarting(true);
    try {
      const created = await createConsultation({
        patient_id: target.id,
        // Consent is captured with the patient record; the backend still
        // requires this flag before it will accept audio.
        consent_confirmed: true,
      });
      setConsultation(created);
      rememberSession(doctor.id, {
        consultationId: created.id,
        patientId: target.id,
        patientName: target.full_name,
        status: created.status,
      });
      setStep(1);
    } catch (err) {
      startedRef.current = false;
      toast({
        kind: "error",
        title: "Could not start the session",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setStarting(false);
    }
  }

  // Arriving from a patient's page ("Start consultation") skips straight to
  // recording — the patient is already chosen.
  useEffect(() => {
    if (presetPatient && doctor && !startedRef.current) {
      void startSession(presetPatient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetPatient, doctor]);

  function handleUploaded() {
    if (consultation && doctor && patient) {
      rememberSession(doctor.id, {
        consultationId: consultation.id,
        patientId: patient.id,
        patientName: patient.full_name,
        status: "uploaded",
      });
      navigate(`/consultations/${consultation.id}`);
    }
  }

  return (
    <main className="page">
      <div className="wiz">
        <div className="wiz-track" aria-label="Steps">
          {STEPS.map((label, i) => (
            <span key={label} style={{ display: "contents" }}>
              {i > 0 && (
                <span
                  className={`wiz-track__bar ${step >= i ? "wiz-track__bar--done" : ""}`}
                />
              )}
              <span
                className={`wiz-track__step ${
                  step === i
                    ? "wiz-track__step--active"
                    : step > i
                      ? "wiz-track__step--done"
                      : ""
                }`}
              >
                <span className="wiz-track__num">
                  {step > i ? <Check size={14} /> : i + 1}
                </span>
                {label}
              </span>
            </span>
          ))}
        </div>

        {step === 0 && (
          <div className="wiz-pane">
            <div className="page-head" style={{ marginBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: "1.25rem" }}>Who is this consultation for?</h1>
                <p className="page-head__sub">
                  Pick a patient to begin recording straight away.
                </p>
              </div>
              <Button onClick={() => setDrawerOpen(true)}>
                <UserPlus size={16} /> New patient
              </Button>
            </div>

            <TextField
              icon={<Search size={16} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name or phone…"
              autoFocus
            />

            <div
              style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}
            >
              {searching ? (
                <SkeletonRows rows={4} height={56} />
              ) : (results ?? []).length === 0 ? (
                <p className="muted" style={{ textAlign: "center", padding: "24px 0" }}>
                  No patients found.{" "}
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      font: "inherit",
                    }}
                    onClick={() => setDrawerOpen(true)}
                  >
                    Add “{query.trim() || "a new patient"}”
                  </button>
                </p>
              ) : (
                (results ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="pt-pick"
                    disabled={starting}
                    onClick={() => void startSession(p)}
                  >
                    <Avatar name={p.full_name} size={40} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600 }}>
                        {p.full_name}
                      </span>
                      <span className="muted" style={{ fontSize: "0.8rem" }}>
                        {[ageFromDob(p.dob), p.gender, p.phone]
                          .filter(Boolean)
                          .join(" · ") || "No details"}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 1 && consultation && patient && (
          <div
            className="wiz-pane"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="page-head" style={{ marginBottom: 0 }}>
              <div>
                <h1 style={{ fontSize: "1.25rem" }}>Capture the consultation</h1>
                <p className="page-head__sub">
                  Session with <strong>{patient.full_name}</strong> — record it live or
                  upload an existing audio file.
                </p>
              </div>
            </div>

            {/* Consent is no longer a blocking step, but the obligation stands —
                keep it visible without making the doctor click through it. */}
            <p className="consent-note">
              <ShieldCheck size={15} />
              Confirm <strong>{patient.full_name}</strong> is aware this consultation is
              being recorded. Audio is stored securely and every access is audit-logged.
            </p>

            <CaptureStage consultationId={consultation.id} onUploaded={handleUploaded} />
          </div>
        )}
      </div>

      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(p) => void startSession(p)}
      />
    </main>
  );
}
