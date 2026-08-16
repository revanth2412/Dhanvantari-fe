import { useState } from "react";
import { Building2, KeyRound } from "lucide-react";
import { createClinic, joinClinic } from "@/services/clinicService";
import type { MyClinic } from "@/types/clinic";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";

interface ClinicSetupProps {
  onDone: (clinic: MyClinic) => void;
  /** Rendered above the choice — context differs per entry point. */
  intro?: string;
  /** Drop the card chrome + heading when already inside a modal/drawer. */
  bare?: boolean;
}

/**
 * Create-or-join, used both during onboarding and from the Clinic page.
 *
 * Creating makes you the clinic's **admin** (clinic-wide visibility + member
 * management); joining with a code makes you a regular member who sees only
 * their own patients and consultations.
 */
export function ClinicSetup({ onDone, intro, bare = false }: ClinicSetupProps) {
  const toast = useToast();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const clinic =
        mode === "create"
          ? await createClinic({
              name: name.trim(),
              city: city.trim() || null,
              phone: phone.trim() || null,
              address: address.trim() || null,
            })
          : await joinClinic({ join_code: joinCode });
      toast({
        kind: "success",
        title: mode === "create" ? "Clinic created" : "Joined clinic",
        message:
          mode === "create" ? `${clinic.name} — you're the clinic admin` : clinic.name,
      });
      onDone(clinic);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up the clinic");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    mode === "create" ? name.trim().length >= 2 : joinCode.trim().length >= 4;

  return (
    <div
      className={bare ? "" : "ui-card ui-card--pad"}
      style={bare ? undefined : { maxWidth: 560, margin: "0 auto" }}
    >
      {!bare && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span className="ui-empty__icon" style={{ marginBottom: 0 }}>
            <Building2 size={22} />
          </span>
          <div>
            <h2 style={{ fontSize: "1.1rem" }}>Set up your clinic</h2>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {intro ??
                "Patients belong to a clinic — you'll only see the ones in yours."}
            </p>
          </div>
        </div>
      )}

      <div className="clinic-choice" style={{ margin: bare ? "0 0 16px" : "16px 0" }}>
        <button
          type="button"
          className={`clinic-choice__opt ${mode === "create" ? "clinic-choice__opt--on" : ""}`}
          onClick={() => setMode("create")}
        >
          <Building2 size={18} />
          <span>Create a clinic</span>
          <small>You&rsquo;ll be its admin and see all its records</small>
        </button>
        <button
          type="button"
          className={`clinic-choice__opt ${mode === "join" ? "clinic-choice__opt--on" : ""}`}
          onClick={() => setMode("join")}
        >
          <KeyRound size={18} />
          <span>Join with a code</span>
          <small>You&rsquo;ll see the records you create</small>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "create" ? (
          <>
            <TextField
              label="Clinic name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sanjeevani Clinic"
              autoFocus
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <TextField
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <TextField
                label="Clinic phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <TextAreaField
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </>
        ) : (
          <TextField
            label="Invite code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            hint="Ask a colleague for the code on their Clinic page."
            autoFocus
            style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}
          />
        )}

        {error && <p className="ui-field__error">{error}</p>}

        <Button
          variant="primary"
          block
          loading={saving}
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          {mode === "create" ? "Create clinic" : "Join clinic"}
        </Button>
      </div>
    </div>
  );
}
