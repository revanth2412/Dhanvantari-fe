import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getMyProfile, updateMyProfile } from "@/services/doctorService";
import type { Doctor } from "@/types/doctor";

type Field = "full_name" | "phone" | "specialty" | "registration_no" | "address";

const BLANK: Record<Field, string> = {
  full_name: "",
  phone: "",
  specialty: "",
  registration_no: "",
  address: "",
};

function formOf(doctor: Doctor | null): Record<Field, string> {
  if (!doctor) return BLANK;
  return {
    full_name: doctor.full_name ?? "",
    phone: doctor.phone ?? "",
    specialty: doctor.specialty ?? "",
    registration_no: doctor.registration_no ?? "",
    address: doctor.address ?? "",
  };
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Doctor profile.
 *
 * The organising idea: these fields *are* the letterhead that gets signed onto
 * every prescription and note, so the letterhead is the page — shown full size,
 * updating as you type, with the form beside it rather than a wall of inputs
 * and a vague promise that it matters somewhere.
 *
 * Saving goes through `PATCH /auth/me`. It previously used `PATCH /doctors/{id}`,
 * which is an admin-only route — a regular doctor got a 403 on both the initial
 * load and every save.
 */
export function ProfilePage() {
  const { doctor, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const rootRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const sealRef = useRef<HTMLSpanElement | null>(null);

  const [profile, setProfile] = useState<Doctor | null>(doctor);
  const [form, setForm] = useState<Record<Field, string>>(() => formOf(doctor));
  const [touched, setTouched] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);

  const saved = useMemo(() => formOf(profile), [profile]);
  const dirty = (Object.keys(saved) as Field[]).some(
    (key) => form[key].trim() !== saved[key].trim(),
  );

  useEffect(() => {
    if (!doctor) return;
    setProfile(doctor);
    setForm(formOf(doctor));
    // Re-read from the server so a change made elsewhere shows up here.
    void getMyProfile()
      .then((fresh) => {
        if (!fresh) return;
        setProfile(fresh);
        setForm(formOf(fresh));
      })
      .catch(() => undefined);
  }, [doctor]);

  /* ---------- entrance + letterhead tilt ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;

    const ctx = gsap.context(() => {
      // Transform only — a stalled tween must never leave the page blank.
      gsap.from("[data-lift]", {
        y: 22,
        duration: 0.6,
        stagger: 0.07,
        ease: "power3.out",
      });
      gsap.from(sealRef.current, {
        scale: 0.4,
        rotate: -35,
        duration: 0.7,
        delay: 0.25,
        ease: "back.out(2.2)",
      });
    }, root);

    const sheet = sheetRef.current;
    if (!sheet || !window.matchMedia("(hover: hover) and (min-width: 981px)").matches) {
      return () => ctx.revert();
    }
    const rotX = gsap.quickTo(sheet, "rotationX", { duration: 0.7, ease: "power2.out" });
    const rotY = gsap.quickTo(sheet, "rotationY", { duration: 0.7, ease: "power2.out" });
    const onMove = (e: PointerEvent) => {
      const box = sheet.getBoundingClientRect();
      rotY(((e.clientX - box.left) / box.width - 0.5) * 9);
      rotX(-((e.clientY - box.top) / box.height - 0.5) * 7);
    };
    const onLeave = () => {
      rotX(0);
      rotY(0);
    };
    sheet.addEventListener("pointermove", onMove);
    sheet.addEventListener("pointerleave", onLeave);
    return () => {
      sheet.removeEventListener("pointermove", onMove);
      sheet.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  function set(field: Field, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched(field);
  }

  function reset() {
    setForm(formOf(profile));
    setTouched(null);
  }

  async function save() {
    if (form.full_name.trim().length < 2) {
      toast({
        kind: "error",
        title: "Name is required",
        message: "Enter at least two characters.",
      });
      return;
    }
    setSaving(true);
    try {
      const next = await updateMyProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        specialty: form.specialty.trim() || null,
        registration_no: form.registration_no.trim() || null,
        address: form.address.trim() || null,
      });
      setProfile(next);
      setForm(formOf(next));
      setTouched(null);
      await refreshProfile();

      // The letterhead gets stamped.
      if (!reducedMotion() && sheetRef.current) {
        gsap.fromTo(
          sheetRef.current,
          { scale: 0.985 },
          { scale: 1, duration: 0.5, ease: "back.out(2)" },
        );
        gsap.fromTo(
          sealRef.current,
          { rotate: -18, scale: 0.82 },
          { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(2.4)" },
        );
      }
      toast({ kind: "success", title: "Letterhead updated" });
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not save",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const name = form.full_name.trim() || profile?.full_name || "Your name";
  const line = (field: Field) => `pf-line ${touched === field ? "pf-line--hot" : ""}`;

  return (
    <main className="page pf" ref={rootRef}>
      {/* ---------------- masthead ---------------- */}
      <header className="pf-top" data-lift>
        <button type="button" className="pf-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={15} /> Dashboard
        </button>

        <div className="pf-id">
          <div className="pf-id__face">
            <Avatar name={profile?.full_name} size={72} />
            <span className="pf-seal" ref={sealRef} title="Verified clinician">
              <Check size={13} strokeWidth={3.4} />
            </span>
          </div>

          <div className="pf-id__text">
            <h1>{name}</h1>
            <p className="pf-id__meta">
              <span>{form.specialty.trim() || "Specialty not set"}</span>
              <i />
              <span className="pf-mono">
                {form.registration_no.trim() || "No registration number"}
              </span>
              <i />
              <span>{profile?.clinic_name ?? "No clinic"}</span>
            </p>
          </div>

          <dl className="pf-account">
            <div>
              <dt>Email</dt>
              <dd>{profile?.email ?? "—"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile?.role === "admin" ? "Administrator" : "Doctor"}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="pf-body">
        {/* ---------------- the letterhead ---------------- */}
        <section className="pf-preview" data-lift>
          <h2 className="pf-kicker">On every note you sign</h2>

          <div className="pf-sheet" ref={sheetRef}>
            <div className="pf-sheet__rule" aria-hidden />
            <div className="pf-sheet__head">
              <strong className={line("full_name")}>{name}</strong>
              <span className={line("specialty")}>
                {form.specialty.trim() || "Specialty"}
              </span>
            </div>

            <div className="pf-sheet__meta">
              <span className={`${line("registration_no")} pf-mono`}>
                Reg. {form.registration_no.trim() || "—"}
              </span>
              <span className={line("phone")}>{form.phone.trim() || "No phone"}</span>
            </div>

            <p className={`pf-sheet__addr ${line("address")}`}>
              {form.address.trim() || "Practice address"}
            </p>

            <div className="pf-sheet__rx" aria-hidden>
              <span className="pf-sheet__rxmark">℞</span>
              <span />
              <span />
              <span />
            </div>

            <div className="pf-sheet__sign">
              <span className="pf-sheet__signline" />
              <small>Signature</small>
            </div>
          </div>

          <button type="button" className="pf-clinic" onClick={() => navigate("/clinic")}>
            <Building2 size={15} />
            <span>
              <b>{profile?.clinic_name ?? "No clinic yet"}</b>
              Manage clinic and colleagues
            </span>
            <ChevronRight size={15} />
          </button>
        </section>

        {/* ---------------- the form ---------------- */}
        <section className="pf-form" data-lift>
          <h2 className="pf-kicker">Details</h2>

          <TextField
            label="Full name"
            required
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Dr. Rajesh Sharma, MD"
            icon={<UserRound size={16} />}
          />
          <div className="pf-form__pair">
            <TextField
              label="Specialty"
              value={form.specialty}
              onChange={(e) => set("specialty", e.target.value)}
              placeholder="Internal Medicine"
              icon={<Stethoscope size={16} />}
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
              icon={<Phone size={16} />}
            />
          </div>
          <TextField
            label="Medical council registration"
            value={form.registration_no}
            onChange={(e) => set("registration_no", e.target.value)}
            placeholder="KMC/2019/84920"
            hint="Printed on prescriptions — check it against your council record."
          />
          <TextAreaField
            label="Practice address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            rows={3}
            placeholder="Suite, street, city, state, PIN"
          />

          <p className="pf-note">
            <MapPin size={13} /> Email and role are managed by your account and
            can&rsquo;t be edited here.
          </p>
        </section>
      </div>

      {/* Appears only when there's something to save. */}
      <div className={`pf-bar ${dirty ? "pf-bar--on" : ""}`} aria-hidden={!dirty}>
        <span className="pf-bar__text">Unsaved changes</span>
        <Button variant="ghost" size="sm" onClick={reset} disabled={saving}>
          <RotateCcw size={14} /> Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={() => void save()}
          tabIndex={dirty ? 0 : -1}
        >
          <Save size={15} /> Save
        </Button>
      </div>
    </main>
  );
}
