import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, HeartPulse, Mic, Pencil, PhoneOff } from "lucide-react";
import { getPatient } from "@/services/patientService";
import { listConsultations } from "@/services/consultationService";
import { getPatientRecords } from "@/services/recordService";
import type { Patient, SocialHistory } from "@/types/patient";
import type { ClinicalRecord } from "@/types/record";
import type { ConsultationListItem } from "@/types/consultation";
import type { Page } from "@/lib/apiClient";
import {
  ageFromDob,
  consultationStatusMeta,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { PatientFormDrawer } from "@/components/patients/PatientFormDrawer";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useReveal } from "@/hooks/useReveal";

function lifestyleEntries(sh: SocialHistory | undefined): Array<[string, string]> {
  if (!sh) return [];
  const entries: Array<[string, string | null | undefined]> = [
    ["Occupation", sh.occupation],
    ["Residence", sh.residence],
    ["Family", sh.family_details],
    ["Marital status", sh.marital_status],
    [
      "Smoking",
      sh.smoking?.status &&
        `${sh.smoking.status}${sh.smoking.detail ? ` — ${sh.smoking.detail}` : ""}`,
    ],
    [
      "Alcohol",
      sh.alcohol?.status &&
        `${sh.alcohol.status}${sh.alcohol.detail ? ` — ${sh.alcohol.detail}` : ""}`,
    ],
    ["Exercise", sh.exercise],
    ["Diet", sh.diet],
    ["Commute", sh.commute],
    ["Mental health", sh.mental_health],
  ];
  return entries.filter((e): e is [string, string] => Boolean(e[1]));
}

/** Latest record per consultation (the API returns every version). */
function latestPerConsultation(records: ClinicalRecord[]): Map<string, ClinicalRecord> {
  const byConsultation = new Map<string, ClinicalRecord>();
  for (const record of records) {
    const existing = byConsultation.get(record.consultation_id);
    if (!existing || record.version > existing.version) {
      byConsultation.set(record.consultation_id, record);
    }
  }
  return byConsultation;
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  // Cached: returning to a patient you already opened is instant.
  const patientQuery = useCachedQuery<Patient>(
    `patient:${patientId}`,
    () => getPatient(patientId!),
    { enabled: Boolean(patientId) },
  );
  const recordsQuery = useCachedQuery<ClinicalRecord[]>(
    `patient:${patientId}:records`,
    () => getPatientRecords(patientId!),
    { enabled: Boolean(patientId) },
  );
  /* The visit list comes from the consultations endpoint, not the records:
     a consultation that failed or is still processing has no note yet, and
     leaving it out would quietly hide a visit that did happen. */
  const visitsQuery = useCachedQuery<Page<ConsultationListItem>>(
    `patient:${patientId}:consultations`,
    () => listConsultations({ patient_id: patientId!, limit: 100 }),
    { enabled: Boolean(patientId) },
  );

  const patient = patientQuery.data ?? null;
  const revealRef = useReveal<HTMLDivElement>("[data-reveal]", [patient?.id]);

  const age = ageFromDob(patient?.dob);
  const lifestyle = lifestyleEntries(patient?.social_history);
  const noteFor = latestPerConsultation(recordsQuery.data ?? []);
  const history = visitsQuery.loading
    ? null
    : (visitsQuery.data?.items ?? []).filter((c) => c.status !== "discarded");

  return (
    <main className="page" ref={revealRef}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/patients")}>
        <ArrowLeft size={15} /> Patients
      </Button>

      <div className="pt-head" style={{ marginTop: 14 }}>
        {patient ? (
          <>
            <Avatar name={patient.full_name} size={64} />
            <div className="pt-head__info">
              <h1>{patient.full_name}</h1>
              <div className="pt-head__tags">
                {age && <Badge>{age}</Badge>}
                {patient.gender && <Badge>{patient.gender}</Badge>}
                {patient.language_pref && (
                  <Badge tone="info">{patient.language_pref}</Badge>
                )}
                {patient.do_not_call && (
                  <Badge tone="danger">
                    <PhoneOff size={11} /> Do not call
                  </Badge>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => setEditOpen(true)}>
                <Pencil size={15} /> Edit
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate("/consultations/new", { state: { patient } })}
              >
                <Mic size={16} /> Start consultation
              </Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1 }}>
            <Skeleton width={280} height={30} radius={8} />
            <Skeleton width={180} height={16} radius={6} style={{ marginTop: 10 }} />
          </div>
        )}
      </div>

      <div className="pt-cols">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="ui-card ui-card--pad" data-reveal>
            <h2 style={{ fontSize: "0.95rem", marginBottom: 10 }}>Details</h2>
            <div className="pt-facts">
              <div className="pt-fact">
                <span className="pt-fact__k">Phone</span>
                <span className="pt-fact__v">{patient?.phone ?? "—"}</span>
              </div>
              <div className="pt-fact">
                <span className="pt-fact__k">Date of birth</span>
                <span className="pt-fact__v">{formatDate(patient?.dob)}</span>
              </div>
              <div className="pt-fact">
                <span className="pt-fact__k">Patient since</span>
                <span className="pt-fact__v">{formatDate(patient?.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="ui-card ui-card--pad" data-reveal>
            <h2 style={{ fontSize: "0.95rem", marginBottom: 12 }}>
              Lifestyle &amp; social
            </h2>
            {lifestyle.length === 0 ? (
              <p className="muted" style={{ fontSize: "0.87rem" }}>
                Nothing recorded yet. This fills in automatically from consultations — the
                AI only adds what was actually discussed, and never overwrites what you
                enter by hand.
              </p>
            ) : (
              <div className="kv-grid" style={{ gridTemplateColumns: "1fr" }}>
                {lifestyle.map(([key, value]) => (
                  <div className="kv-tile" key={key}>
                    <div className="kv-tile__k">{key}</div>
                    <div className="kv-tile__v">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ui-card" data-reveal>
          <div className="panel-head" style={{ paddingBottom: 12 }}>
            <h2>Clinical history</h2>
            {history && history.length > 0 && (
              <Badge tone="ok">
                {history.length} consultation{history.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div style={{ padding: "6px 22px 22px" }}>
            {history === null ? (
              <SkeletonRows rows={3} height={64} />
            ) : history.length === 0 ? (
              <EmptyState
                icon={<HeartPulse size={24} />}
                title="No clinical records yet"
                message="Start a consultation with this patient — the AI-drafted note will appear here."
                action={
                  patient && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        navigate("/consultations/new", { state: { patient } })
                      }
                    >
                      <Mic size={16} /> Start consultation
                    </Button>
                  )
                }
              />
            ) : (
              <div className="timeline">
                {history.map((visit) => {
                  const note = noteFor.get(visit.id);
                  const meta = consultationStatusMeta[visit.status];
                  const diagnoses = note?.data.diagnosis ?? [];
                  return (
                    <div className="timeline-item" key={visit.id}>
                      <div
                        className="ui-card ui-card--pad ui-card--hover"
                        style={{ cursor: "pointer", padding: 16 }}
                        onClick={() => navigate(`/consultations/${visit.id}`)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <FileText size={16} style={{ color: "var(--primary)" }} />
                          <strong style={{ flex: 1, fontSize: "0.93rem" }}>
                            {note?.data.chief_complaint ?? "Consultation"}
                          </strong>
                          {note && (
                            <Badge tone={note.status === "final" ? "ok" : "warn"}>
                              {note.status === "final" ? "Final" : "Draft"} · v
                              {note.version}
                            </Badge>
                          )}
                          <Badge tone={meta.tone} dot>
                            {meta.label}
                          </Badge>
                        </div>
                        <div
                          className="muted"
                          style={{ fontSize: "0.8rem", marginTop: 6 }}
                        >
                          {formatDateTime(visit.created_at)}
                          {visit.doctor_name && <> · {visit.doctor_name}</>}
                          {diagnoses.length > 0 && (
                            <> · {diagnoses.map((d) => d.condition).join(", ")}</>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <PatientFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        patient={patient}
        onSaved={patientQuery.mutate}
      />
    </main>
  );
}
