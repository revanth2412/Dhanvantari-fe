import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Search, ShieldCheck, UserPlus } from "lucide-react";
import { searchPatients } from "@/services/patientService";
import { createConsultation } from "@/services/consultationService";
import { rememberSession } from "@/lib/recents";
import { ageFromDob } from "@/lib/format";
import type { Patient } from "@/types/patient";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CheckField, TextField } from "@/components/ui/Field";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { PatientFormDrawer } from "@/components/patients/PatientFormDrawer";
import { CaptureStage } from "@/components/consultation/CaptureStage";

const STEPS = ["Patient", "Consent", "Start consultation"] as const;

export function NewConsultationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor } = useAuth();
  const toast = useToast();

  const presetPatient = useMemo(
    () => (location.state as { patient?: Patient } | null)?.patient ?? null,
    [location.state],
  );

  const [step, setStep] = useState(presetPatient ? 1 : 0);
  const [patient, setPatient] = useState<Patient | null>(presetPatient);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 280);
  const [results, setResults] = useState<Patient[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [consultation, setConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    if (step !== 0) return;
    const controller = new AbortController();
    setResults(null);
    searchPatients(debouncedQuery, controller.signal)
      .then(setResults)
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setResults([]);
        }
      });
    return () => controller.abort();
  }, [debouncedQuery, step]);

  async function startSession() {
    if (!patient || !doctor) return;
    setStarting(true);
    try {
      const created = await createConsultation({
        patient_id: patient.id,
        consent_confirmed: true,
      });
      setConsultation(created);
      rememberSession(doctor.id, {
        consultationId: created.id,
        patientId: patient.id,
        patientName: patient.full_name,
        status: created.status,
      });
      setStep(2);
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not start the session",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setStarting(false);
    }
  }

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
                  Pick an existing patient or add a new one.
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
              {results === null ? (
                <SkeletonRows rows={4} height={56} />
              ) : results.length === 0 ? (
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
                results.map((p) => {
                  const selected = patient?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`pt-pick ${selected ? "pt-pick--selected" : ""}`}
                      onClick={() => {
                        setPatient(p);
                        setStep(1);
                      }}
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
                      {selected && (
                        <Check size={18} style={{ color: "var(--primary)" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {step === 1 && patient && (
          <div
            className="wiz-pane"
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div className="pt-pick pt-pick--selected" style={{ cursor: "default" }}>
              <Avatar name={patient.full_name} size={40} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600 }}>
                  {patient.full_name}
                </span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {[ageFromDob(patient.dob), patient.gender, patient.phone]
                    .filter(Boolean)
                    .join(" · ") || "No details"}
                </span>
              </span>
              {!presetPatient && (
                <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                  Change
                </Button>
              )}
            </div>

            <div className="consent-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={20} style={{ color: "var(--primary)" }} />
                <h2 style={{ fontSize: "1rem" }}>Recording consent</h2>
              </div>
              <ul>
                <li>The patient has been told this consultation will be recorded.</li>
                <li>The recording is used only to prepare their clinical note.</li>
                <li>Audio is stored securely and every access is audit-logged.</li>
              </ul>
              <CheckField
                label={
                  <>
                    <strong>{patient.full_name}</strong> has verbally consented to this
                    consultation being recorded.
                  </>
                }
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="ghost"
                onClick={() => (presetPatient ? navigate(-1) : setStep(0))}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={!consent}
                loading={starting}
                onClick={() => void startSession()}
              >
                Begin session
              </Button>
            </div>
          </div>
        )}

        {step === 2 && consultation && patient && (
          <div
            className="wiz-pane"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
            <CaptureStage consultationId={consultation.id} onUploaded={handleUploaded} />
          </div>
        )}
      </div>

      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(p) => {
          setPatient(p);
          setStep(1);
        }}
      />
    </main>
  );
}
