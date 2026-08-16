import { useEffect, useState } from "react";
import { Mail, RefreshCw, ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const POLL_MS = 30_000;

/**
 * Shown when a platform admin has globally revoked the account
 * (`doctor.active === false`). This blocks the doctor in *every* clinic.
 *
 * There is no self-service way back: the `/auth/reapply` endpoint was removed
 * when signup stopped requiring approval, so only an admin can restore access
 * via `POST /admin/doctors/{id}/activate`. We poll so the doctor is let straight
 * back in the moment that happens.
 */
export function AccessRevokedPage() {
  const { doctor, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshProfile();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshProfile]);

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
        </div>

        <Badge tone="danger" dot>
          Access revoked
        </Badge>

        <h1 style={{ fontSize: "1.35rem", margin: "14px 0 8px" }}>
          Your account has been disabled
        </h1>

        <p className="muted" style={{ maxWidth: 400, margin: "0 auto" }}>
          Access for <strong>{doctor?.email}</strong> was revoked by a platform
          administrator, so you can&rsquo;t use MediVaani in any clinic right now.
          Contact your administrator to have it restored — this page updates automatically
          once they do.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 22,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = `mailto:?subject=${encodeURIComponent(
                "MediVaani access request",
              )}&body=${encodeURIComponent(
                `Hello,\n\nMy MediVaani account (${doctor?.email ?? ""}) has been revoked. Could you please restore my access?\n\nThank you,\n${doctor?.full_name ?? ""}`,
              )}`;
            }}
          >
            <Mail size={15} /> Email an admin
          </Button>
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
