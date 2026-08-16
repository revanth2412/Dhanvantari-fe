import { Activity, Building2, LogOut } from "lucide-react";
import { getMyClinics, switchClinic } from "@/services/clinicService";
import type { ClinicMembership } from "@/types/clinic";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDataCache } from "@/hooks/useDataCache";
import { useToast } from "@/hooks/useToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClinicSetup } from "@/components/clinic/ClinicSetup";

/**
 * Shown when the doctor has a usable account but no active clinic selected
 * (`status === "no_clinic"`). Every clinical route 403s until one is chosen, so
 * this is a hard gate — but it also lists clinics they already belong to, which
 * matters when an admin has unassigned them.
 */
export function SelectClinicPage() {
  const { doctor, refreshProfile, signOut } = useAuth();
  const cache = useDataCache();
  const toast = useToast();

  const { data: memberships, loading } = useCachedQuery<ClinicMembership[]>(
    "clinics:mine",
    getMyClinics,
  );

  // Only clinics they can actually work in are worth offering.
  const usable = (memberships ?? []).filter((m) => m.active && m.clinic_active);

  async function handleSwitch(clinicId: string) {
    try {
      const clinic = await switchClinic(clinicId);
      toast({ kind: "success", title: "Clinic selected", message: clinic.name });
      cache.invalidate();
      await refreshProfile();
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
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Activity size={22} color="var(--primary)" />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                Welcome, {doctor?.full_name?.split(" ").slice(-1)[0] ?? "Doctor"}
              </div>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                One last step before you can start
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut size={15} /> Sign out
          </Button>
        </div>

        {!loading && usable.length > 0 && (
          <div className="ui-card ui-card--pad" style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 10 }}>
              Continue in a clinic you belong to
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {usable.map((m) => (
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

        <ClinicSetup
          intro="Create a clinic to become its admin, or join your colleagues with their invite code."
          onDone={() => {
            cache.invalidate();
            void refreshProfile();
          }}
        />
      </div>
    </div>
  );
}
