import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  Fingerprint,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
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
  const rootRef = useRef<HTMLElement | null>(null);

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

  // GSAP Entrance Stagger
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-profile-elem]",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.08, ease: "power3.out" },
      );
    }, root);

    return () => ctx.revert();
  }, []);

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
        title: "Profile updated successfully",
        message: "Your clinician practice credentials have been saved.",
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
    <main className="page profile-page" ref={rootRef}>
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BREADCRUMB & ACTIONS BAR                       */}
      {/* ------------------------------------------------------------- */}
      <div className="profile-top-bar" data-profile-elem>
        <button
          type="button"
          className="profile-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="profile-top-actions">
          <div className="profile-security-pill">
            <ShieldCheck size={14} className="profile-icon-emerald" />
            <span>DPDP Act 2023 Enforced · AES-256 Encrypted</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() => void saveProfile()}
          >
            <Save size={15} /> Save Changes
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REVAMPED HERO IDENTIFICATION BANNER                           */}
      {/* ------------------------------------------------------------- */}
      <header className="profile-hero-v2" data-profile-elem>
        <div className="profile-hero-v2__glow" aria-hidden />

        <div className="profile-hero-v2__grid">
          {/* Avatar with Status Ring & Stroke-Drawing Animated Verified Tick */}
          <div className="profile-avatar-v2">
            <Avatar name={profile?.full_name} size={92} />
            <div className="profile-verified-badge" title="Verified Clinician">
              <svg
                className="profile-verified-svg"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="profile-verified-svg__circle"
                  cx="12"
                  cy="12"
                  r="9.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
                <path
                  className="profile-verified-svg__check"
                  d="M7.5 12.2L10.5 15.2L16.5 9.2"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Doctor Info & Meta */}
          <div className="profile-hero-v2__info">
            <div className="profile-hero-v2__eyebrow">
              <Sparkles size={14} /> Professional Clinician Telemetry
            </div>
            <h1>Dr. {fullName || profile?.full_name || "Clinician"}</h1>

            <div className="profile-hero-v2__pills">
              <span className="profile-pill-v2">
                <Stethoscope size={13} /> {specialty || "General Medicine"}
              </span>
              <span className="profile-pill-v2">
                <Fingerprint size={13} /> Reg: {registrationNo || "Registration Pending"}
              </span>
              <span className="profile-pill-v2">
                <Building2 size={13} /> {profile?.clinic_name || "Independent Practice"}
              </span>
            </div>
          </div>

          {/* Telemetry Status Box */}
          <div className="profile-hero-v2__telemetry">
            <div className="profile-telemetry-badge">
              <span className="profile-pulse-dot" />
              <strong>
                {profile?.approval_status === "approved"
                  ? "Verified Clinician"
                  : "Account Active"}
              </strong>
            </div>
            <div className="profile-telemetry-sub">
              <span>OPD Ambient Scribe Active</span>
              <small>
                Role:{" "}
                {profile?.role === "admin"
                  ? "Platform Administrator"
                  : "Attending Doctor"}
              </small>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MULTI-CARD SETTINGS GRID                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="profile-grid-v2">
        {/* Main Column: Practice Details Form */}
        <section className="profile-card-v2" data-profile-elem>
          <div className="profile-card-v2__header">
            <div>
              <h2>Practice Credentials &amp; Profile</h2>
              <p>
                These credentials appear on your generated clinical SOAP notes,
                prescriptions, and official medical exports.
              </p>
            </div>
            <div className="profile-card-v2__icon-badge">
              <Stethoscope size={22} />
            </div>
          </div>

          <div className="profile-form-v2">
            <TextField
              label="Full Name (with credentials)"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma, MD"
              icon={<UserRound size={16} />}
            />
            <TextField
              label="Primary Practice Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              icon={<Phone size={16} />}
            />
            <TextField
              label="Medical Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Internal Medicine / Cardiology"
              icon={<Stethoscope size={16} />}
            />
            <TextField
              label="Medical Council Registration No."
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="e.g. KMC/2019/84920"
              icon={<BadgeCheck size={16} />}
            />
            <div className="profile-form-v2__full">
              <TextAreaField
                label="Practice / Hospital Suite Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Hospital / OPD Clinic suite, Street, City, State, PIN code"
              />
            </div>
          </div>

          {/* Live Prescription Preview */}
          <div className="profile-rx-preview-box">
            <div className="profile-rx-preview-header">
              <FileCheck size={16} className="profile-icon-emerald" />
              <strong>Live Prescription Sign-Off Preview</strong>
              <Badge tone="ok">Auto-Generated</Badge>
            </div>
            <div className="profile-rx-preview-content">
              <div className="profile-rx-doc-name">
                Dr. {fullName || "Rajesh Sharma, MD"}
              </div>
              <div className="profile-rx-doc-meta">
                <span>{specialty || "Internal Medicine"}</span> ·{" "}
                <span>Reg No: {registrationNo || "KMC/12345"}</span>
              </div>
              <div className="profile-rx-address">
                <MapPin size={12} />{" "}
                {address || "Clinical OPD Practice Suite, General Hospital"}
              </div>
            </div>
          </div>

          <div className="profile-card-v2__footer">
            <span>
              <MapPin size={14} /> Synchronized automatically across all consultation
              notes
            </span>
            <Button
              variant="primary"
              size="lg"
              loading={saving}
              onClick={() => void saveProfile()}
            >
              <Save size={16} /> Save Practice Changes
            </Button>
          </div>
        </section>

        {/* Side Column: Clinic & Security Stack */}
        <aside className="profile-side-stack">
          {/* Card: Connected Clinic Workspace */}
          <div className="profile-side-card" data-profile-elem>
            <div className="profile-side-card__header">
              <Building2 size={18} className="profile-icon-emerald" />
              <h3>Clinic Workspace</h3>
            </div>

            <div className="profile-clinic-block">
              <strong>{profile?.clinic_name || "My Practice Workspace"}</strong>
              <small>Active Consultation Workspace</small>
            </div>

            <p className="profile-side-card__desc">
              Collaborate seamlessly with colleagues and staff within your shared clinic
              roster.
            </p>

            <button
              type="button"
              className="profile-clinic-link-btn"
              onClick={() => navigate("/clinic")}
            >
              <span>Manage Clinic &amp; Members</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Card: Account Security & Compliance */}
          <div className="profile-side-card" data-profile-elem>
            <div className="profile-side-card__header">
              <UserCheck size={18} className="profile-icon-emerald" />
              <h3>Account Security</h3>
            </div>

            <div className="profile-facts-list">
              <div className="profile-fact-item">
                <Mail size={14} />
                <div>
                  <small>Login Email</small>
                  <span>{profile?.email || "—"}</span>
                </div>
              </div>

              <div className="profile-fact-item">
                <ShieldCheck size={14} />
                <div>
                  <small>Authorization Role</small>
                  <span>
                    {profile?.role === "admin"
                      ? "Platform Administrator"
                      : "Attending Doctor"}
                  </span>
                </div>
              </div>

              <div className="profile-fact-item">
                <Calendar size={14} />
                <div>
                  <small>Clinician Status</small>
                  <span style={{ color: "var(--green-700)", fontWeight: 700 }}>
                    <CheckCircle2
                      size={13}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 4,
                      }}
                    />
                    Active &amp; Verified
                  </span>
                </div>
              </div>
            </div>

            <p className="profile-side-card__desc" style={{ marginTop: 14 }}>
              Protected under Digital Personal Data Protection (DPDP) Act 2023
              regulations.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
