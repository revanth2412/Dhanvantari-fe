import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowLeft,
  FileText,
  Languages,
  Lock,
  Mail,
  Mic,
  ShieldCheck,
} from "lucide-react";
import { authService } from "@/services/authService";
import { BrandMark } from "@/components/ui/BrandMark";
import { GoogleButton } from "@/components/GoogleButton";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

type Mode = "signin" | "signup";

const PROOF = [
  { icon: Mic, text: "Record the consultation — no typing, no templates" },
  { icon: FileText, text: "A structured, ICD-10 coded note in seconds" },
  { icon: Languages, text: "Understands multilingual Indian OPD" },
  { icon: ShieldCheck, text: "Consent-first, audit-logged, doctor-signed" },
];

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Sign in / sign up.
 *
 * Shares the landing page's language — evergreen wash, floating glass, the
 * same green CTA — so arriving here doesn't feel like a different product.
 *
 * Motion rule: GSAP drives the *decoration* (drifting aurora, the pointer
 * parallax, the capture bars, the card's mode change). Anything carrying words
 * fades in with a CSS keyframe instead, because a `gsap.from` that never runs
 * leaves its target invisible — and a login form you cannot see is a dead end.
 */
export function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  /* ---------- ambient motion + pointer parallax ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to("[data-aurora='1']", {
        xPercent: 12,
        yPercent: -10,
        scale: 1.12,
        duration: 11,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-aurora='2']", {
        xPercent: -14,
        yPercent: 12,
        scale: 1.08,
        duration: 14,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-bar]", {
        scaleY: 1.9,
        duration: 0.62,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.07, from: "random" },
      });
    }, root);

    // Desktop only: the glass card leans towards the pointer.
    const card = cardRef.current;
    if (!card || !window.matchMedia("(hover: hover) and (min-width: 821px)").matches) {
      return () => ctx.revert();
    }
    const rotX = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power2.out" });
    const rotY = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power2.out" });
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      rotY(x * 7);
      rotX(-y * 5);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  /* ---------- the card acknowledges a mode change ---------- */
  useEffect(() => {
    const card = cardRef.current;
    if (!card || reducedMotion()) return;
    // Movement only — never opacity. A tween that stalls must not be able to
    // dim the heading of a sign-in form.
    const tween = gsap.fromTo(
      card.querySelectorAll("[data-swap]"),
      { y: 10 },
      { y: 0, duration: 0.42, ease: "power2.out", stagger: 0.04 },
    );
    return () => {
      tween.kill();
    };
  }, [mode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await authService.signInWithPassword(email, password);
        if (error) throw error;
        // On success, AuthProvider's onAuthStateChange handles the redirect.
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

  const isSignIn = mode === "signin";

  return (
    <div className="au" ref={rootRef}>
      <div className="au__sky" aria-hidden>
        <span className="au__aurora au__aurora--1" data-aurora="1" />
        <span className="au__aurora au__aurora--2" data-aurora="2" />
      </div>

      {/* ---------------- story panel (desktop) ---------------- */}
      <aside className="au__story">
        <Link className="au__brand au__enter" to="/landing">
          <BrandMark size={28} />
          <span>
            MediVaani<b>AI</b>
          </span>
        </Link>

        <div className="au__pitch au__enter">
          <span className="au__pill">
            <i />
            Ambient scribe · live
          </span>
          <h1>
            Talk to your patient.
            <span className="au__grad">We&rsquo;ll write the note.</span>
          </h1>
          <ul className="au__proof">
            {PROOF.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="au__proof-icon">
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="au__capture au__enter" aria-hidden>
          <div className="au__bars">
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} data-bar />
            ))}
          </div>
          <span className="au__capture-note">Listening · consent-gated</span>
        </div>
      </aside>

      {/* ---------------- auth card ---------------- */}
      <main className="au__panel">
        <Link className="au__back" to="/landing">
          <ArrowLeft size={15} /> Back
        </Link>

        {/* Compact brand, phone only — the story panel is desktop-only. */}
        <Link className="au__brand au__brand--sm" to="/landing">
          <BrandMark size={24} />
          <span>
            MediVaani<b>AI</b>
          </span>
        </Link>

        <div className="au__card au__enter" ref={cardRef}>
          <div className="au__card-head">
            <h2 data-swap>{isSignIn ? "Welcome back" : "Create your account"}</h2>
            <p data-swap>
              {isSignIn
                ? "Sign in to your clinic workspace."
                : "Free to start. No card, no setup call."}
            </p>
          </div>

          <GoogleButton onClick={() => void handleGoogle()} disabled={submitting} />

          <div className="au__or">
            <span>or with email</span>
          </div>

          <form onSubmit={handleSubmit} className="au__form">
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
              autoComplete={isSignIn ? "current-password" : "new-password"}
              minLength={6}
              placeholder="••••••••"
              required
            />

            {error && <p className="ui-field__error au__msg">{error}</p>}
            {info && <p className="au__msg au__msg--ok">{info}</p>}

            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              {isSignIn ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="au__switch" data-swap>
            {isSignIn ? "New to MediVaani?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignIn ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
            >
              {isSignIn ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="au__legal">
          <ShieldCheck size={12} /> DPDP Act 2023 aligned · recordings stay consent-backed
        </p>
      </main>
    </div>
  );
}
