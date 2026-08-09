import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { searchPatients } from "@/services/patientService";
import type { Patient } from "@/types/patient";
import { ageFromDob, formatDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/Field";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { PatientFormDrawer } from "@/components/patients/PatientFormDrawer";
import { useDebounce } from "@/hooks/useDebounce";
import { useReveal } from "@/hooks/useReveal";

export function PatientsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 280);
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const revealRef = useReveal<HTMLDivElement>("tbody tr", [patients]);

  useEffect(() => {
    const controller = new AbortController();
    setPatients(null);
    searchPatients(debouncedQuery, controller.signal)
      .then(setPatients)
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setPatients([]);
        }
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Patients</h1>
          <p className="page-head__sub">
            Search by name or phone, or add a new patient to your practice.
          </p>
        </div>
        <Button variant="primary" onClick={() => setDrawerOpen(true)}>
          <UserPlus size={16} /> Add patient
        </Button>
      </div>

      <div className="patients-toolbar">
        <TextField
          icon={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name or phone…"
          aria-label="Search patients"
        />
      </div>

      <div className="ui-card" style={{ overflow: "hidden" }} ref={revealRef}>
        {patients === null ? (
          <SkeletonRows rows={6} height={48} />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title={query ? "No patients match your search" : "No patients yet"}
            message={
              query
                ? "Try a different name or phone number."
                : "Add your first patient — takes under a minute."
            }
            action={
              !query && (
                <Button variant="primary" onClick={() => setDrawerOpen(true)}>
                  <UserPlus size={16} /> Add patient
                </Button>
              )
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="ui-table ui-table--clickable">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Language</th>
                  <th>Added</th>
                  <th aria-hidden />
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const age = ageFromDob(patient.dob);
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td>
                        <div className="patient-cell">
                          <Avatar name={patient.full_name} size={36} />
                          <div style={{ minWidth: 0 }}>
                            <div className="patient-cell__name">{patient.full_name}</div>
                            <div className="patient-cell__sub">
                              {[age, patient.gender].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{patient.phone ?? "—"}</td>
                      <td>
                        {patient.language_pref ? (
                          <Badge tone="info">{patient.language_pref}</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="muted">{formatDate(patient.created_at)}</td>
                      <td style={{ width: 40 }}>
                        <ChevronRight size={16} className="faint" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(patient) => navigate(`/patients/${patient.id}`)}
      />
    </main>
  );
}
