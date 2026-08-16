import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  discardConsultation,
  getConsultation,
  reprocessConsultation,
} from "@/services/consultationService";
import { getPatient } from "@/services/patientService";
import { rememberSession } from "@/lib/recents";
import { ageFromDob, consultationStatusMeta } from "@/lib/format";
import type { Consultation, ConsultationStatus } from "@/types/consultation";
import type { Patient } from "@/types/patient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, Modal } from "@/components/ui/Modal";
import { EcgLoader } from "@/components/ui/EcgLoader";
import { CaptureStage } from "@/components/consultation/CaptureStage";
import { ConsultationProvenance } from "@/components/consultation/ConsultationProvenance";
import { PipelineStatus } from "@/components/consultation/PipelineStatus";
import { NotePanel } from "@/components/note/NotePanel";
import { TranscriptPanel } from "@/components/consultation/TranscriptPanel";

const POLL_MS = 3000;
const PIPELINE_ACTIVE: ConsultationStatus[] = ["uploaded", "transcribing", "extracting"];

/**
 * One consultation, end to end: capture (if no audio yet) → animated pipeline
 * while the backend transcribes/extracts → note review + transcript when ready.
 */
export function ConsultationSessionPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const { doctor } = useAuth();
  const toast = useToast();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const pollRef = useRef<number>(0);

  const applyConsultation = useCallback(
    (next: Consultation, patientName?: string) => {
      setConsultation(next);
      if (doctor) {
        rememberSession(doctor.id, {
          consultationId: next.id,
          patientId: next.patient_id,
          patientName: patientName ?? "Patient",
          status: next.status,
        });
      }
    },
    [doctor],
  );

  // Initial load: consultation + its patient.
  useEffect(() => {
    if (!consultationId) return;
    let cancelled = false;
    getConsultation(consultationId)
      .then(async (c) => {
        if (cancelled) return;
        const p = await getPatient(c.patient_id).catch(() => null);
        if (cancelled) return;
        setPatient(p);
        applyConsultation(c, p?.full_name);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Consultation not found");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [consultationId, applyConsultation]);

  // Poll while the pipeline is running.
  useEffect(() => {
    if (!consultation || !PIPELINE_ACTIVE.includes(consultation.status)) return;
    pollRef.current = window.setInterval(() => {
      getConsultation(consultation.id)
        .then((next) => {
          if (next.status !== consultation.status) {
            applyConsultation(next, patient?.full_name);
            if (next.status === "draft_ready") {
              toast({
                kind: "success",
                title: "Draft note ready",
                message: "Review, edit and finalize it below.",
              });
            }
            if (next.status === "failed") {
              toast({
                kind: "error",
                title: "Processing failed",
                message: next.error_detail ?? undefined,
              });
            }
          }
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(pollRef.current);
  }, [consultation, patient?.full_name, applyConsultation, toast]);

  async function handleRetry() {
    if (!consultation) return;
    setRetrying(true);
    try {
      const next = await reprocessConsultation(consultation.id);
      applyConsultation(next, patient?.full_name);
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not restart processing",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRetrying(false);
    }
  }

  async function handleDiscard() {
    if (!consultation) return;
    setDiscarding(true);
    try {
      const next = await discardConsultation(consultation.id);
      applyConsultation(next, patient?.full_name);
      setDiscardOpen(false);
      toast({
        kind: "success",
        title: "Consultation discarded",
        message: "It no longer appears in listings.",
      });
    } catch (err) {
      toast({
        kind: "error",
        title: "Could not discard",
        // 409 = already finalized; the backend protects the signed record.
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDiscarding(false);
    }
  }

  if (loadError) {
    return (
      <main className="page">
        <div
          className="ui-card ui-card--pad"
          style={{ textAlign: "center", padding: 48 }}
        >
          <h1 style={{ fontSize: "1.2rem", marginBottom: 8 }}>
            Consultation unavailable
          </h1>
          <p className="muted">{loadError}</p>
          <Button style={{ marginTop: 18 }} onClick={() => navigate("/")}>
            <ArrowLeft size={15} /> Back to dashboard
          </Button>
        </div>
      </main>
    );
  }

  if (!consultation) {
    return (
      <main
        className="page"
        style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}
      >
        <EcgLoader label="Opening session…" />
      </main>
    );
  }

  const meta = consultationStatusMeta[consultation.status];
  const isDiscarded = consultation.status === "discarded";
  const showCapture = consultation.status === "recording" && !isDiscarded;
  const showPipeline =
    !isDiscarded &&
    (PIPELINE_ACTIVE.includes(consultation.status) || consultation.status === "failed");
  const showReview =
    !isDiscarded &&
    (consultation.status === "draft_ready" || consultation.status === "finalized");
  // Finalized records are signed clinical documents — the backend refuses to
  // discard them (409), so don't offer the action.
  const canDiscard = !isDiscarded && consultation.status !== "finalized";

  return (
    <main className={`page ${showReview ? "page--wide" : ""}`}>
      {/* In review mode the patient identity lives inside the note's own
          header block — no separate page header. */}
      {!showReview && (
        <div className="session-head">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </Button>
          <Avatar name={patient?.full_name} size={46} />
          <div className="session-head__info">
            <h1>{patient?.full_name ?? "Consultation"}</h1>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {[ageFromDob(patient?.dob), patient?.gender, patient?.phone]
                .filter(Boolean)
                .join(" · ") || "Consultation session"}
            </p>
          </div>
          <Badge
            tone={meta.tone}
            dot
            live={PIPELINE_ACTIVE.includes(consultation.status)}
          >
            {meta.label}
          </Badge>
          {canDiscard && (
            <Button
              variant="danger-soft"
              size="sm"
              className="session-head__discard"
              onClick={() => setDiscardOpen(true)}
              title="Discard this consultation"
            >
              <Trash2 size={14} /> Discard
            </Button>
          )}
        </div>
      )}

      {/* Provenance rides along outside review mode too — the note panel
          renders its own copy once the record exists. */}
      {!showReview && (
        <ConsultationProvenance
          consultation={consultation}
          className="prov--standalone"
        />
      )}

      {isDiscarded && (
        <div className="ui-card ui-card--pad discarded-note">
          <Trash2 size={20} />
          <div>
            <strong>This consultation was discarded.</strong>
            <p className="muted" style={{ fontSize: "0.87rem", marginTop: 2 }}>
              It stays out of listings and can&rsquo;t be processed further. Start a new
              consultation if you need to record this visit again.
            </p>
          </div>
          <Button onClick={() => navigate("/consultations/new")}>New consultation</Button>
        </div>
      )}

      {showCapture && (
        <div className="wiz">
          <CaptureStage
            consultationId={consultation.id}
            onUploaded={() =>
              applyConsultation(
                { ...consultation, status: "uploaded" },
                patient?.full_name,
              )
            }
          />
        </div>
      )}

      {showPipeline && (
        <div className="wiz">
          <PipelineStatus
            consultation={consultation}
            onRetry={() => void handleRetry()}
            retrying={retrying}
          />
        </div>
      )}

      {showReview && (
        <>
          <NotePanel
            consultation={consultation}
            patient={patient}
            patientName={patient?.full_name}
            onBack={() => navigate(-1)}
            onShowTranscript={() => setShowTranscript(true)}
            onDiscard={canDiscard ? () => setDiscardOpen(true) : undefined}
            onFinalized={() =>
              applyConsultation(
                { ...consultation, status: "finalized" },
                patient?.full_name,
              )
            }
          />
          <Drawer
            open={showTranscript}
            onClose={() => setShowTranscript(false)}
            title="Verbatim transcript"
          >
            <TranscriptPanel consultationId={consultation.id} frameless />
          </Drawer>
        </>
      )}

      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard this consultation?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDiscardOpen(false)}
              disabled={discarding}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={discarding}
              onClick={() => void handleDiscard()}
            >
              <Trash2 size={15} /> Discard
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--ink-2)", fontSize: "0.93rem" }}>
          The session for <strong>{patient?.full_name ?? "this patient"}</strong> will be
          hidden from listings and can no longer be processed. The recording and any draft
          note are retained for audit, but you won&rsquo;t be able to work on them.
        </p>
      </Modal>
    </main>
  );
}
