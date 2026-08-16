import { type ReactNode } from "react";
import { Building2, LogOut, RefreshCw, ShieldX } from "lucide-react";
import { getMyClinics, switchClinic } from "@/services/clinicService";
import type { ClinicMembership } from "@/types/clinic";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDataCache } from "@/hooks/useDataCache";
import { useToast } from "@/hooks/useToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/**
 * Blocks the workspace when the doctor's access to their *current* clinic is
 * gone — either their membership was revoked by the clinic admin, or a platform
 * admin revoked the whole clinic.
 *
 * This can't live in `AuthStatus`: `/auth/me` returns no membership flags, so
 * the state is only knowable from `GET /clinics/mine`. Crucially, this is a
 * per-clinic block — if the doctor belongs to other working clinics we offer to
 * switch, because they're still entitled to use those.
 */
export function ClinicGate({ children }: { children: ReactNode }) {
  const { doctor, refreshProfile, signOut } = useAuth();
  const cache = useDataCache();
  const toast = useToast();

  const { data, loading, refresh } = useCachedQuery<ClinicMembership[]>(
    "clinics:mine",
    getMyClinics,
    { ttlMs: 120_000 },
  );

  // While unknown, let the app render — individual calls still fail safely and
  // a blocking spinner on every page load would be worse.
  if (loading || !data) return <>{children}</>;

  const current = data.find((m) => m.clinic_id === doctor?.clinic_id);
  const blocked = current ? !current.active || !current.clinic_active : false;
  if (!blocked) return <>{children}</>;

  const membershipRevoked = current !== undefined && !current.active;
  const alternatives = data.filter(
    (m) => m.clinic_id !== current?.clinic_id && m.active && m.clinic_active,
  );

  async function handleSwitch(clinicId: string) {
    try {
      const clinic = await switchClinic(clinicId);
      toast({ kind: "success", title: "Switched clinic", message: clinic.name });
      cache.invalidate();
      await refreshProfile();
      void refresh();
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not switch clinic",
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="center-screen">
      <div className="pending-card" style={{ maxWidth: 520 }}>
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
          {membershipRevoked ? "Removed from clinic" : "Clinic suspended"}
        </Badge>

        <h1 style={{ fontSize: "1.3rem", margin: "14px 0 8px" }}>
          {current?.name ?? "This clinic"} is unavailable
        </h1>

        <p className="muted" style={{ maxWidth: 400, margin: "0 auto" }}>
          {membershipRevoked ? (
            <>
              A clinic admin removed your access to <strong>{current?.name}</strong>. Ask
              them to restore it if this wasn&rsquo;t expected.
            </>
          ) : (
            <>
              A platform administrator has suspended <strong>{current?.name}</strong>, so
              nobody can work in it right now.
            </>
          )}
        </p>

        {alternatives.length > 0 && (
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <div className="kv-tile__k" style={{ marginBottom: 8 }}>
              Continue in another clinic
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alternatives.map((m) => (
                <button
                  key={m.clinic_id}
                  type="button"
                  className="pt-pick"
                  onClick={() => void handleSwitch(m.clinic_id)}
                >
                  <span className="clinic-row__icon">
                    <Building2 size={17} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600 }}>{m.name}</span>
                    <span className="muted" style={{ fontSize: "0.8rem" }}>
                      {m.city ?? "—"}
                    </span>
                  </span>
                  {m.role === "admin" && <Badge tone="accent">clinic admin</Badge>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 22,
            flexWrap: "wrap",
          }}
        >
          <Button onClick={() => void refresh()}>
            <RefreshCw size={15} /> Check again
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOut size={15} /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
