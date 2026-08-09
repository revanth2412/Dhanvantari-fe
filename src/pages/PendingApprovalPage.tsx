import { useEffect, useState } from "react";
import { Hourglass, RefreshCw, ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const POLL_MS = 20_000;

/** Awaiting-approval / rejected screen. Auto-refreshes the profile so the
 * doctor moves on the moment an admin approves them. */
export function PendingApprovalPage() {
  const { doctor, status, refreshProfile, signOut } = useAuth();
  const rejected = status === "rejected";
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (rejected) return;
    const timer = window.setInterval(() => {
      void refreshProfile();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [rejected, refreshProfile]);

  async function handleRefresh() {
    setChecking(true);
    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="pending-card">
        <div className="pending-orbit">
          {!rejected && (
            <>
              <span className="pending-orbit__ring" aria-hidden>
                <span className="pending-orbit__sat" />
              </span>
              <span className="pending-orbit__core">
                <Hourglass size={26} />
              </span>
            </>
          )}
          {rejected && (
            <span
              className="pending-orbit__core"
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger)",
                animation: "none",
              }}
            >
              <ShieldX size={26} />
            </span>
          )}
        </div>

        <Badge tone={rejected ? "danger" : "warn"} live={!rejected} dot>
          {rejected ? "Access declined" : "Awaiting approval"}
        </Badge>

        <h1 style={{ fontSize: "1.35rem", margin: "14px 0 8px" }}>
          {rejected
            ? "Your account isn't active"
            : `Almost there, ${doctor?.full_name ?? "doctor"}`}
        </h1>

        <p className="muted" style={{ maxWidth: 360, margin: "0 auto" }}>
          {rejected ? (
            <>
              Your account (<strong>{doctor?.email}</strong>) is not currently active.
              Please contact your administrator.
            </>
          ) : (
            <>
              An administrator is reviewing your profile. This page checks automatically —
              you&rsquo;ll be let in the moment you&rsquo;re approved.
            </>
          )}
        </p>

        <div
          style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}
        >
          <Button onClick={() => void handleRefresh()} loading={checking}>
            <RefreshCw size={15} /> Check now
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
