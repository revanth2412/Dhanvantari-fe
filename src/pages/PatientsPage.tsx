import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  ChevronRight,
  Globe,
  Mic,
  Phone,
  Search,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { searchPatients } from "@/services/patientService";
import type { Patient } from "@/types/patient";
import { ageFromDob, formatDate } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { PatientFormDrawer } from "@/components/patients/PatientFormDrawer";
import { useAuth } from "@/hooks/useAuth";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { useMyPatients } from "@/hooks/useMyPatients";

export function PatientsPage() {
  const navigate = useNavigate();
  const { doctor } = useAuth();
  const rootRef = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 260);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterGender, setFilterGender] = useState<"all" | "male" | "female" | "elderly">(
    "all",
  );

  // Cached query
  const { data, loading } = useCachedQuery<Patient[]>(
    `patients:list:${debouncedQuery.trim()}`,
    () => searchPatients(debouncedQuery),
  );

  const fetched = useMemo(() => {
    return loading ? null : (data ?? []);
  }, [loading, data]);

  // This roster is the doctor's own, even for a clinic admin — the clinic-wide
  // directory lives on the clinic page.
  const { patients: allPatients, narrowed, hiddenCount } = useMyPatients(fetched);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!allPatients) return null;
    let list = allPatients;

    if (filterGender === "male") {
      list = list.filter(
        (p) => p.gender?.toLowerCase() === "male" || p.gender?.toLowerCase() === "m",
      );
    } else if (filterGender === "female") {
      list = list.filter(
        (p) => p.gender?.toLowerCase() === "female" || p.gender?.toLowerCase() === "f",
      );
    } else if (filterGender === "elderly") {
      list = list.filter((p) => {
        const age = p.dob ? parseInt(ageFromDob(p.dob) || "0", 10) : 0;
        return age >= 60;
      });
    }

    return list;
  }, [allPatients, filterGender]);

  // GSAP animation
  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !filteredPatients ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    gsap.fromTo(
      "[data-patient-row]",
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.04, ease: "power2.out" },
    );
  }, [filteredPatients]);

  const handleStartConsultation = (e: React.MouseEvent | null, patientId: string) => {
    if (e) e.stopPropagation();
    haptic("medium");
    navigate(`/consultations/new?patient_id=${patientId}`);
  };

  const handleOpenPatient = (patientId: string) => {
    haptic("light");
    navigate(`/patients/${patientId}`);
  };

  return (
    <main className="page pts-root" ref={rootRef}>
      {/* ------------------------------------------------------------- */}
      {/* HEADER & ROSTER TELEMETRY                                     */}
      {/* ------------------------------------------------------------- */}
      <header className="pts-header">
        <div className="pts-header__left">
          <div className="pts-badge">
            <UsersRound size={13} className="pts-icon-emerald" />
            <span>PRACTICE CLINICAL DIRECTORY</span>
          </div>
          <h1>Patient Roster</h1>
          <p className="pts-subtitle">
            {doctor?.clinic_name ? (
              <>
                Patients you have consulted at <strong>{doctor.clinic_name}</strong>.
                Search, initiate ambient consultations, or review clinical histories.
              </>
            ) : (
              "Search clinical records, launch consultations, or register new patients."
            )}
          </p>
          {/* A clinic admin's roster stays personal; point them at the full
              directory rather than silently hiding colleagues' patients. */}
          {narrowed && hiddenCount > 0 && (
            <p className="pts-scope-note">
              <UsersRound size={12} />
              <span>
                {hiddenCount} more patient{hiddenCount === 1 ? "" : "s"} in this clinic
                were seen by colleagues —{" "}
                <button type="button" onClick={() => navigate("/clinic")}>
                  view the clinic directory
                </button>
                .
              </span>
            </p>
          )}
        </div>

        <div className="pts-header__actions">
          <Button variant="primary" size="lg" onClick={() => setDrawerOpen(true)}>
            <UserPlus size={17} /> Add New Patient
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH & CATEGORY FILTER BAR                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="pts-toolbar-card">
        <div className="pts-search-wrap">
          <Search size={18} className="pts-search-icon" />
          <input
            type="text"
            className="pts-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roster by patient name, phone number, or UHID…"
            aria-label="Search patients"
          />
          {query && (
            <button type="button" className="pts-clear-btn" onClick={() => setQuery("")}>
              ×
            </button>
          )}
        </div>

        <div className="pts-filter-chips">
          <button
            type="button"
            className={`pts-chip ${filterGender === "all" ? "pts-chip--active" : ""}`}
            onClick={() => setFilterGender("all")}
          >
            All Patients ({allPatients?.length ?? 0})
          </button>
          <button
            type="button"
            className={`pts-chip ${filterGender === "female" ? "pts-chip--active" : ""}`}
            onClick={() => setFilterGender("female")}
          >
            Female
          </button>
          <button
            type="button"
            className={`pts-chip ${filterGender === "male" ? "pts-chip--active" : ""}`}
            onClick={() => setFilterGender("male")}
          >
            Male
          </button>
          <button
            type="button"
            className={`pts-chip ${filterGender === "elderly" ? "pts-chip--active" : ""}`}
            onClick={() => setFilterGender("elderly")}
          >
            Senior (60+)
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PATIENT LIST TABLE / CARDS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="pts-table-card">
        {filteredPatients === null ? (
          <SkeletonRows rows={7} height={52} />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={query ? "No patients match your search" : "No patients yet"}
            message={
              query
                ? "Try searching by a different name, phone number, or clear filters."
                : narrowed && hiddenCount > 0
                  ? "You haven't consulted anyone here yet. Colleagues' patients are listed on the clinic page."
                  : "Register your first patient to begin capturing ambient clinical documentation."
            }
            action={
              !query && (
                <Button variant="primary" onClick={() => setDrawerOpen(true)}>
                  <UserPlus size={16} /> Add First Patient
                </Button>
              )
            }
          />
        ) : (
          <div className="pts-table-scroll">
            <table className="pts-table">
              <thead>
                <tr>
                  <th>PATIENT</th>
                  <th>PHONE &amp; CONTACT</th>
                  <th>PREFERRED LANGUAGE</th>
                  <th>REGISTERED DATE</th>
                  <th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const age = ageFromDob(patient.dob);
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => handleOpenPatient(patient.id)}
                      className="pts-row"
                      data-patient-row
                    >
                      <td>
                        <div className="pts-patient-cell">
                          <Avatar name={patient.full_name} size={40} />
                          <div className="pts-patient-meta">
                            <div className="pts-patient-name">{patient.full_name}</div>
                            <div className="pts-patient-sub">
                              {[age, patient.gender].filter(Boolean).join(" · ") ||
                                "Patient"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pts-phone-cell">
                          {patient.phone ? (
                            <>
                              <Phone size={13} className="pts-text-muted" />
                              <span>{patient.phone}</span>
                            </>
                          ) : (
                            <span className="pts-text-faint">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {patient.language_pref ? (
                          <span className="pts-lang-badge">
                            <Globe size={11} />
                            {patient.language_pref}
                          </span>
                        ) : (
                          <span className="pts-text-faint">English (Default)</span>
                        )}
                      </td>
                      <td>
                        <span className="pts-date-cell">
                          {formatDate(patient.created_at)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="pts-actions-cell">
                          <button
                            type="button"
                            className="pts-btn-consult"
                            title="Start consultation for this patient"
                            onClick={(e) => handleStartConsultation(e, patient.id)}
                          >
                            <Mic size={14} />
                            <span>Consult</span>
                          </button>
                          <button
                            type="button"
                            className="pts-btn-view"
                            title="View patient records & chart"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPatient(patient.id);
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Form Drawer */}
      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={(patient) => {
          setDrawerOpen(false);
          handleStartConsultation(null, patient.id);
        }}
      />
    </main>
  );
}
