import { useRef, useState, type DragEvent } from "react";
import { FileAudio, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { uploadRecording } from "@/services/consultationService";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AudioRecorder } from "@/components/recorder/AudioRecorder";
import { useToast } from "@/hooks/useToast";

type CaptureTab = "record" | "upload";

interface CaptureStageProps {
  consultationId: string;
  /** Called once the audio is uploaded and the pipeline has started. */
  onUploaded: () => void;
}

// Everything the pipeline's STT (ElevenLabs Scribe) can ingest — audio files
// plus video containers (phone consultation recordings are usually video/mp4;
// only the audio track is transcribed).
const UPLOAD_EXT_RE =
  /\.(mp3|m4a|mp4|mov|wav|webm|ogg|oga|opus|aac|flac|amr|3gp|mkv|wma|aiff?)$/i;
const UPLOAD_ACCEPT =
  "audio/*,video/mp4,video/webm,video/quicktime,.mp3,.m4a,.mp4,.mov,.wav,.webm,.ogg,.oga,.opus,.aac,.flac,.amr,.3gp,.mkv,.wma,.aif,.aiff";

/** Record-in-browser or upload-a-file stage for a consultation. */
export function CaptureStage({ consultationId, onUploaded }: CaptureStageProps) {
  const toast = useToast();
  const [tab, setTab] = useState<CaptureTab>("record");
  const [captured, setCaptured] = useState<{ blob: Blob; filename: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function acceptFile(file: File) {
    const typeOk = file.type.startsWith("audio/") || file.type.startsWith("video/");
    if (!typeOk && !UPLOAD_EXT_RE.test(file.name)) {
      toast({
        kind: "error",
        title: "Unsupported file",
        message: `${file.name} — use an audio or video recording (MP3, M4A, MP4, WAV…).`,
      });
      return;
    }
    setCaptured({ blob: file, filename: file.name });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  }

  async function handleUpload() {
    if (!captured) return;
    setUploading(true);
    try {
      await uploadRecording(consultationId, captured.blob, captured.filename);
      toast({
        kind: "success",
        title: "Audio uploaded",
        message: "Transcription has started — this usually takes a couple of minutes.",
      });
      onUploaded();
    } catch (err) {
      toast({
        kind: "error",
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
      setUploading(false);
    }
  }

  const sizeMb = captured ? (captured.blob.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="ui-card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 20 }}>
        <Tabs<CaptureTab>
          value={tab}
          onChange={(next) => {
            setTab(next);
            setCaptured(null);
          }}
          options={[
            { value: "record", label: "Record live" },
            { value: "upload", label: "Upload audio" },
          ]}
        />
      </div>

      {tab === "record" ? (
        <AudioRecorder
          onCaptured={(blob, filename) => setCaptured({ blob, filename })}
          onDiscarded={() => setCaptured(null)}
          disabled={uploading}
        />
      ) : (
        <div style={{ padding: 24 }}>
          {!captured ? (
            <div
              className={`drop-zone ${dragOver ? "drop-zone--over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") fileInputRef.current?.click();
              }}
            >
              <UploadCloud
                size={34}
                style={{ color: "var(--primary)", marginBottom: 10 }}
              />
              <p style={{ fontWeight: 600, color: "var(--ink)" }}>
                Drop the consultation recording here
              </p>
              <p style={{ fontSize: "0.84rem", marginTop: 4 }}>
                or click to browse — MP3, M4A, MP4, WAV, WebM… (video files work too; only
                the audio is transcribed)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={UPLOAD_ACCEPT}
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) acceptFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <div className="upload-review">
              <FileAudio size={26} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                  {captured.filename}
                </div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {sizeMb} MB
                </div>
              </div>
              <Button
                variant="ghost"
                iconOnly
                onClick={() => setCaptured(null)}
                aria-label="Remove file"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0 24px 26px",
        }}
      >
        <Button
          variant="primary"
          size="lg"
          disabled={!captured}
          loading={uploading}
          onClick={() => void handleUpload()}
        >
          <Sparkles size={18} /> Generate clinical note
        </Button>
      </div>
    </div>
  );
}
