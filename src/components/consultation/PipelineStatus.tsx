import {
  AlertTriangle,
  Check,
  FileAudio,
  FileText,
  Languages,
  Sparkles,
} from "lucide-react";
import type { Consultation } from "@/types/consultation";
import { Button } from "@/components/ui/Button";

interface PipelineStatusProps {
  consultation: Consultation;
  onRetry: () => void;
  retrying: boolean;
}

const STEPS = [
  {
    key: "uploaded",
    icon: FileAudio,
    title: "Audio received",
    desc: "The recording is stored securely and queued for processing.",
  },
  {
    key: "transcribing",
    icon: Languages,
    title: "Transcribing the conversation",
    desc: "Speech-to-text with speaker separation, tuned for clinical vocabulary.",
  },
  {
    key: "extracting",
    icon: Sparkles,
    title: "Drafting the clinical note",
    desc: "The AI structures symptoms, diagnosis, prescriptions and advice.",
  },
  {
    key: "draft_ready",
    icon: FileText,
    title: "Draft ready for review",
    desc: "You review, edit and finalize — nothing is filed without you.",
  },
] as const;

/** Where each consultation status sits on the 4-step pipeline. */
function activeIndex(status: Consultation["status"]): number {
  switch (status) {
    case "uploaded":
      return 1; // received; waiting for the transcriber to pick it up
    case "transcribing":
      return 1;
    case "extracting":
      return 2;
    case "draft_ready":
    case "finalized":
      return 4;
    default:
      return 0;
  }
}

const EQ = (
  <span className="pipe-eq" aria-hidden>
    <i />
    <i />
    <i />
    <i />
  </span>
);

export function PipelineStatus({ consultation, onRetry, retrying }: PipelineStatusProps) {
  const failed = consultation.status === "failed";
  const active = activeIndex(consultation.status);

  return (
    <div className="ui-card ui-card--pad" style={{ padding: "34px 28px" }}>
      <div className="pipe">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < active;
          const isActive = !failed && i === active;
          const isFailed = failed && i === active;
          return (
            <div
              key={step.key}
              className={`pipe-step ${isDone ? "pipe-step--done" : ""} ${
                isActive ? "pipe-step--active" : ""
              } ${isFailed ? "pipe-step--failed" : ""}`}
            >
              <div className="pipe-step__rail">
                <span className="pipe-step__dot">
                  {isDone ? (
                    <Check size={17} />
                  ) : isFailed ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Icon size={17} />
                  )}
                </span>
                {i < STEPS.length - 1 && <span className="pipe-step__line" />}
              </div>
              <div className="pipe-step__body">
                <div className="pipe-step__title">
                  {step.title}
                  {isActive && i < 3 && EQ}
                </div>
                <p className="pipe-step__desc">
                  {isFailed
                    ? (consultation.error_detail ??
                      "Something went wrong while processing this recording.")
                    : step.desc}
                </p>
                {isFailed && (
                  <Button
                    variant="danger-soft"
                    size="sm"
                    style={{ marginTop: 10 }}
                    loading={retrying}
                    onClick={onRetry}
                  >
                    Retry processing
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
