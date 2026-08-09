import { useState, type FormEvent } from "react";
import { authService } from "@/services/authService";
import { GoogleButton } from "@/components/GoogleButton";

type Mode = "signin" | "signup";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="center-screen">
      <div className="card">
        <h1 className="brand">Dhanvantari</h1>
        <p className="muted">
          {mode === "signin" ? "Sign in to your account" : "Create a doctor account"}
        </p>

        <GoogleButton onClick={handleGoogle} disabled={submitting} />

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>

          {error && <p className="error">{error}</p>}
          {info && <p className="info">{info}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="muted switch">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="link"
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
  );
}
