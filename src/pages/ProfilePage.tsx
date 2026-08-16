import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getDoctor, updateDoctor } from "@/services/doctorService";
import type { Doctor } from "@/types/doctor";

function emptyToNull(value: string): string | null {
  return value.trim() || null;
}

export function ProfilePage() {
  const { doctor, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Doctor | null>(doctor);
  const [fullName, setFullName] = useState(doctor?.full_name ?? "");
  const [phone, setPhone] = useState(doctor?.phone ?? "");
  const [specialty, setSpecialty] = useState(doctor?.specialty ?? "");
  const [registrationNo, setRegistrationNo] = useState(doctor?.registration_no ?? "");
  const [address, setAddress] = useState(doctor?.address ?? "");
  const [saving, setSaving] = useState(false);

  function hydrate(next: Doctor) {
    setProfile(next);
    setFullName(next.full_name);
    setPhone(next.phone ?? "");
    setSpecialty(next.specialty ?? "");
    setRegistrationNo(next.registration_no ?? "");
    setAddress(next.address ?? "");
  }

  useEffect(() => {
    if (!doctor) return;
    hydrate(doctor);
    void getDoctor(doctor.id)
      .then(hydrate)
      .catch(() => undefined);
  }, [doctor]);

  async function saveProfile() {
    if (!doctor || fullName.trim().length < 2) {
      toast({
        kind: "error",
        title: "Name is required",
        message: "Enter at least two characters.",
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateDoctor(doctor.id, {
        full_name: fullName.trim(),
        phone: emptyToNull(phone),
        specialty: emptyToNull(specialty),
        registration_no: emptyToNull(registrationNo),
        address: emptyToNull(address),
      });
      hydrate(updated);
      await refreshProfile();
      toast({
        kind: "success",
        title: "Profile updated",
        message: "Your practice details are saved.",
      });
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not update profile",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page profile-page">
      <header className="profile-hero">
        <div className="profile-hero__aurora" aria-hidden />
        <div className="profile-hero__top">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Back
          </Button>
          <Badge tone="ok" dot>
            Profile active
          </Badge>
        </div>
        <div className="profile-hero__identity">
          <div className="profile-avatar-wrap">
            <Avatar name={profile?.full_name} size={72} />
            <span>
              <BadgeCheck size={17} />
            </span>
          </div>
          <div>
            <p className="profile-hero__eyebrow">
              <Sparkles size={14} /> Professional settings
            </p>
            <h1>{profile?.full_name ?? "My profile"}</h1>
            <p>
              {profile?.specialty ?? "Add your specialty"} <i>·</i>{" "}
              {profile?.registration_no ?? "Registration not added"}
            </p>
          </div>
        </div>
      </header>

      <div className="profile-layout">
        <aside className="profile-summary ui-card">
          <div className="profile-summary__heading">
            <ShieldCheck size={18} />
            <span>Account status</span>
          </div>
          <div className="profile-summary__state">
            <span className="profile-summary__pulse" />
            <div>
              <strong>
                {profile?.approval_status === "approved"
                  ? "Verified clinician"
                  : "Account pending"}
              </strong>
              <small>
                {profile?.active
                  ? "Workspace access enabled"
                  : "Access is currently restricted"}
              </small>
            </div>
          </div>
          <div className="profile-summary__facts">
            <div>
              <Mail size={15} />
              <span>
                <small>Email</small>
                {profile?.email ?? "—"}
              </span>
            </div>
            <div>
              <Building2 size={15} />
              <span>
                <small>Role</small>
                {profile?.role === "admin" ? "Administrator" : "Doctor"}
              </span>
            </div>
          </div>
          <p className="profile-summary__note">
            Your email and access controls are protected account settings. Contact an
            administrator to change them.
          </p>
        </aside>

        <section className="profile-settings ui-card ui-card--pad">
          <div className="profile-settings__head">
            <div>
              <h2>Practice details</h2>
              <p>These details appear across your clinical workspace.</p>
            </div>
            <Stethoscope className="profile-settings__icon" size={22} />
          </div>
          <div className="profile-form">
            <TextField
              label="Full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<UserRound size={16} />}
            />
            <TextField
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              icon={<Phone size={16} />}
            />
            <TextField
              label="Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. General Medicine"
              icon={<Stethoscope size={16} />}
            />
            <TextField
              label="Medical registration no."
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="e.g. KMC/12345"
              icon={<BadgeCheck size={16} />}
            />
            <div className="profile-form__wide">
              <TextAreaField
                label="Practice address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Clinic / hospital address"
              />
            </div>
          </div>
          <div className="profile-card__actions">
            <span>
              <MapPin size={15} /> Saved securely to your clinician profile
            </span>
            <Button variant="primary" loading={saving} onClick={() => void saveProfile()}>
              <Save size={16} /> Save changes
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
