import { useEffect, useState } from "react";
import { AudioLines } from "lucide-react";
import { getTranscript } from "@/services/consultationService";
import type { Transcript } from "@/types/consultation";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";

/** Verbatim, diarized transcript of the consultation. */
export function TranscriptPanel({
  consultationId,
  frameless = false,
}: {
  consultationId: string;
  /** Render without the card chrome (e.g. inside a drawer). */
  frameless?: boolean;
}) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTranscript(consultationId)
      .then((t) => {
        if (!cancelled) setTranscript(t);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [consultationId]);

  const speakers = new Map<string, number>();
  const speakerIndex = (speaker: string | null): number => {
    const key = speaker ?? "unknown";
    if (!speakers.has(key)) speakers.set(key, speakers.size);
    return speakers.get(key) ?? 0;
  };

  return (
    <div className={frameless ? "" : "ui-card tx-panel"}>
      <div
        className="panel-head"
        style={{ paddingBottom: 14, ...(frameless ? { padding: "0 0 12px" } : {}) }}
      >
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AudioLines size={17} style={{ color: "var(--primary)" }} /> Transcript
        </h2>
        {transcript?.language_detected && (
          <Badge tone="info">{transcript.language_detected}</Badge>
        )}
      </div>

      {failed ? (
        <EmptyState
          icon={<AudioLines size={22} />}
          title="Transcript not available"
          message="The verbatim transcript could not be loaded for this consultation."
        />
      ) : transcript === null ? (
        <SkeletonRows rows={6} height={40} />
      ) : !transcript.segments || transcript.segments.length === 0 ? (
        <EmptyState
          icon={<AudioLines size={22} />}
          title="Empty transcript"
          message="No speech was detected in the recording."
        />
      ) : (
        <div style={{ paddingBottom: 12 }}>
          {transcript.segments.map((seg, i) => {
            const idx = speakerIndex(seg.speaker);
            return (
              <div
                key={i}
                className={`tx-seg ${idx === 0 ? "tx-seg--doctor" : "tx-seg--patient"}`}
                style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
              >
                <span className="tx-seg__who">Speaker {idx + 1}</span>
                <div>
                  <p className="tx-seg__text">{seg.text}</p>
                  {seg.start !== null && (
                    <span className="tx-seg__time">{formatDuration(seg.start)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
