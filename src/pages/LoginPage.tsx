import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import {
  Activity,
  FileText,
  Languages,
  Lock,
  Mail,
  Mic,
  ShieldCheck,
} from "lucide-react";
import { authService } from "@/services/authService";
import { GoogleButton } from "@/components/GoogleButton";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

type Mode = "signin" | "signup";

const POINTS = [
  {
    icon: <Mic size={17} />,
    text: "Record the consultation — no typing, no templates to fill",
  },
  {
    icon: <FileText size={17} />,
    text: "AI drafts a structured clinical note in minutes",
  },
  {
    icon: <Languages size={17} />,
    text: "Understands multilingual, real-world consultations",
  },
  {
    icon: <ShieldCheck size={17} />,
    text: "Consent-first, audit-logged, doctor-verified records",
  },
];

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const brandRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = brandRef.current;
    if (!root) return;
    const items = root.querySelectorAll("[data-reveal]");
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.1 },
    );
    return () => {
      tween.kill();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await authService.signInWithPassword(email, password);
        if (error) throw error;
        // On success, AuthContext's onAuthStateChange handles the redirect.
      } else {
        const { data, error } = await authService.signUpWithPassword(email, password);
        if (error) throw error;
        // If email confirmation is enabled, there is no session yet.
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await authService.signInWithGoogle();
    if (error) setError(error.message);
  }

  return (
    <div className="auth-split">
      <div className="auth-split__brand" ref={brandRef}>
        <span className="auth-orb auth-orb--jade" aria-hidden />
        <span className="auth-orb auth-orb--saffron" aria-hidden />

        <div className="auth-brand-row" data-reveal>
          <Activity size={22} color="#22c99d" />
          MediVaani
        </div>

        <div className="auth-hero">
          <h1 data-reveal>
            Talk to your patient.
            <br />
            <span className="grad-text">We&rsquo;ll write the note.</span>
          </h1>
          <p data-reveal>
            MediVaani listens to the consultation, transcribes it with medical-grade
            accuracy, and drafts a structured clinical note you review and sign off.
          </p>
          <div className="auth-hero__points">
            {POINTS.map((point) => (
              <div className="auth-point" key={point.text} data-reveal>
                <span className="auth-point__icon">{point.icon}</span>
                {point.text}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-foot" data-reveal>
          Built for clinicians · Your recordings stay private &amp; consent-backed
        </div>
      </div>

      <div className="auth-split__form">
        <div className="auth-form-card">
          <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted" style={{ marginBottom: 22 }}>
            {mode === "signin"
              ? "Sign in to your clinic workspace"
              : "Start documenting consultations with AI"}
          </p>

          <GoogleButton onClick={() => void handleGoogle()} disabled={submitting} />

          <div className="ui-divider">
            <span>or continue with email</span>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <TextField
              label="Email"
              type="email"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="doctor@clinic.com"
              required
            />
            <TextField
              label="Password"
              type="password"
              icon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              placeholder="••••••••"
              required
            />

            {error && <p className="ui-field__error">{error}</p>}
            {info && (
              <p style={{ color: "var(--primary-strong)", fontSize: "0.85rem" }}>
                {info}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p
            className="muted"
            style={{ textAlign: "center", marginTop: 18, fontSize: "0.9rem" }}
          >
            {mode === "signin" ? "New to MediVaani?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="link"
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                cursor: "pointer",
                padding: 0,
                fontWeight: 600,
                fontSize: "inherit",
              }}
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
