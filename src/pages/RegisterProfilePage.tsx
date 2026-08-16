import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, KeyRound, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { registerProfile } from "@/services/doctorService";
import { createClinic, joinClinic } from "@/services/clinicService";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";

const SPECIALTIES = [
  "General Medicine",
  "Pediatrics",
  "Gynecology",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "ENT",
  "Psychiatry",
  "Neurology",
  "Endocrinology",
];

type ClinicMode = "create" | "join" | "skip";

const STEP_COUNT = 4;

/**
 * First-time onboarding for a signed-in user with no doctor profile:
 * identity → practice → clinic → review.
 *
 * The clinic decides what the doctor can see — patients are scoped to a clinic —
 * so it is set up here. The profile must exist before /clinics accepts the call,
 * hence both happen on submit, in order.
 */
export function RegisterProfilePage() {
  const { session, refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [address, setAddress] = useState("");
  const [clinicMode, setClinicMode] = useState<ClinicMode>("create");
  const [clinicName, setClinicName] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await registerProfile({
        full_name: fullName.trim(),
        specialty: specialty.trim() || null,
        registration_no: registrationNo.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      });

      // The clinic step is best-effort: the profile is already created, so a
      // clinic failure must not strand the doctor on this screen. They can
      // finish setting it up from the Clinic page.
      try {
        if (clinicMode === "create" && clinicName.trim()) {
          await createClinic({
            name: clinicName.trim(),
            city: clinicCity.trim() || null,
            phone: clinicPhone.trim() || null,
            address: clinicAddress.trim() || null,
          });
        } else if (clinicMode === "join" && joinCode.trim()) {
          await joinClinic({ join_code: joinCode });
        }
      } catch (clinicErr) {
        // Surfaced on the Clinic page instead of blocking onboarding.
        console.warn("clinic setup deferred:", clinicErr);
      }

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your profile");
      setSubmitting(false);
    }
  }

  const canNext =
    step === 0
      ? fullName.trim().length >= 2
      : step === 2
        ? clinicMode !== "create" || clinicName.trim().length >= 2
        : true;

  return (
    <div className="center-screen">
      <div className="onb-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="ui-empty__icon"
              style={{ width: 40, height: 40, marginBottom: 0 }}
            >
              <Stethoscope size={20} />
            </span>
            <div>
              <h2 style={{ fontSize: "1.2rem" }}>Set up your practice</h2>
              <p className="muted" style={{ fontSize: "0.82rem" }}>
                Signed in as <strong>{session?.user.email}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="onb-steps" aria-hidden>
          {Array.from({ length: STEP_COUNT }, (_, i) => i).map((i) => (
            <span
              key={i}
              className={`onb-steps__dot ${i <= step ? "onb-steps__dot--done" : ""}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="onb-pane" key="s0">
            <TextField
              label="Full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Asha Rao"
              autoFocus
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              hint="Optional — used by your clinic admin to reach you."
            />
          </div>
        )}

        {step === 1 && (
          <div className="onb-pane" key="s1">
            <div className="ui-field">
              <span className="ui-field__label">Specialty</span>
              <div className="onb-chips">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`ui-chip ${specialty === s ? "ui-chip--active" : ""}`}
                    onClick={() => setSpecialty(specialty === s ? "" : s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <TextField
              label="Or type your own"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Sports Medicine"
            />
            <TextField
              label="Medical registration no."
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="e.g. KMC/12345"
              hint="Appears on the notes you finalize."
            />
            <TextAreaField
              label="Practice address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Clinic or hospital address"
            />
          </div>
        )}

        {step === 2 && (
          <div className="onb-pane" key="s2">
            <div>
              <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>Your clinic</h3>
              <p className="muted" style={{ fontSize: "0.84rem" }}>
                Patients belong to a clinic, and you&rsquo;ll only see the ones in yours.
                Start a new clinic or join your colleagues with their code.
              </p>
            </div>

            <div className="clinic-choice">
              <button
                type="button"
                className={`clinic-choice__opt ${clinicMode === "create" ? "clinic-choice__opt--on" : ""}`}
                onClick={() => setClinicMode("create")}
              >
                <Building2 size={18} />
                <span>Create a clinic</span>
                <small>I&rsquo;m setting up a new practice</small>
              </button>
              <button
                type="button"
                className={`clinic-choice__opt ${clinicMode === "join" ? "clinic-choice__opt--on" : ""}`}
                onClick={() => setClinicMode("join")}
              >
                <KeyRound size={18} />
                <span>Join with a code</span>
                <small>My colleagues already use MediVaani</small>
              </button>
            </div>

            {clinicMode === "create" && (
              <>
                <TextField
                  label="Clinic name"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Sanjeevani Clinic"
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <TextField
                    label="City"
                    value={clinicCity}
                    onChange={(e) => setClinicCity(e.target.value)}
                    placeholder="Hyderabad"
                  />
                  <TextField
                    label="Clinic phone"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="+91…"
                  />
                </div>
                <TextAreaField
                  label="Clinic address"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  rows={2}
                />
                <p className="ui-field__hint">
                  You&rsquo;ll get an invite code to share with your colleagues.
                </p>
              </>
            )}

            {clinicMode === "join" && (
              <TextField
                label="Invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                hint="Ask a colleague for the code on their Clinic page."
                style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}
              />
            )}

            <button
              type="button"
              className="link-quiet"
              onClick={() => setClinicMode("skip")}
            >
              Skip for now — I&rsquo;ll set this up later
            </button>
            {clinicMode === "skip" && (
              <p className="ui-field__hint">
                You can create or join a clinic any time from the Clinic page.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="onb-pane" key="s3">
            <dl className="onb-review" style={{ margin: 0 }}>
              <div>
                <dt>Name</dt>
                <dd>{fullName.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{phone.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Specialty</dt>
                <dd>{specialty.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Registration no.</dt>
                <dd>{registrationNo.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Practice address</dt>
                <dd>{address.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Clinic</dt>
                <dd>
                  {clinicMode === "create"
                    ? clinicName.trim() || "—"
                    : clinicMode === "join"
                      ? `Joining ${joinCode.trim() || "—"}`
                      : "Set up later"}
                </dd>
              </div>
            </dl>
            <p className="muted" style={{ fontSize: "0.86rem" }}>
              You&rsquo;re all set — no approval needed. Creating a clinic makes you its
              admin, so you&rsquo;ll see every consultation in it; joining one with a code
              shows you the records you create.
            </p>
            {error && <p className="ui-field__error">{error}</p>}
          </div>
        )}

        <div className="onb-actions">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
            >
              <ArrowLeft size={16} /> Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          )}
          {step < STEP_COUNT - 1 ? (
            <Button
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
            >
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              loading={submitting}
            >
              Finish setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
