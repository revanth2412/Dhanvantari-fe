import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { registerProfile } from "@/services/doctorService";

/**
 * Shown when a user is authenticated in Supabase but has no doctor profile yet.
 * Collects the professional details and creates the profile (starts `pending`).
 */
export function RegisterProfilePage() {
  const { session, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerProfile({
        full_name: fullName.trim(),
        specialty: specialty.trim() || null,
        registration_no: registrationNo.trim() || null,
        phone: phone.trim() || null,
      });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card">
        <h1 className="brand">Complete your profile</h1>
        <p className="muted">
          Signed in as <strong>{session?.user.email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Full name *</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>

          <label className="field">
            <span>Specialty</span>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. General Medicine"
            />
          </label>

          <label className="field">
            <span>Medical registration no.</span>
            <input
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for approval"}
          </button>
        </form>

        <button type="button" className="link" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
