import { useState } from "react";
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { registerProfile } from "@/services/doctorService";
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

/**
 * First-time onboarding for a signed-in user with no doctor profile:
 * a 3-step wizard (identity → practice → review) that ends in `pending`.
 */
export function RegisterProfilePage() {
  const { session, refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [address, setAddress] = useState("");
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
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your profile");
      setSubmitting(false);
    }
  }

  const canNext = step === 0 ? fullName.trim().length >= 2 : true;

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
          {[0, 1, 2].map((i) => (
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
              hint="Helps your admin verify and approve you faster."
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
            </dl>
            <p className="muted" style={{ fontSize: "0.86rem" }}>
              Your profile is reviewed by an administrator before you can start
              documenting consultations. You&rsquo;ll be notified here once approved.
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
          {step < 2 ? (
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
              Submit for approval
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
