import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AudioPlayer } from "@/components/recorder/AudioPlayer";

type RecorderState = "idle" | "recording" | "paused" | "done";

interface AudioRecorderProps {
  /** Called when a take is finished (stop pressed). */
  onCaptured: (blob: Blob, filename: string) => void;
  /** Called when the user discards the take. */
  onDiscarded: () => void;
  disabled?: boolean;
}

function pickMimeType(): { mime: string; ext: string } {
  const candidates: Array<{ mime: string; ext: string }> = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/mp4", ext: "mp4" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) {
      return c;
    }
  }
  return { mime: "", ext: "webm" };
}

/**
 * In-browser consultation recorder: MediaRecorder + a live frequency-bar
 * waveform drawn on canvas, with pause/resume and a monospace timer.
 */
export function AudioRecorder({ onCaptured, onDiscarded, disabled }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [micLabel, setMicLabel] = useState<string | null>(null);
  const [takeDuration, setTakeDuration] = useState(0);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const pausedTotalRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const stateRef = useRef<RecorderState>("idle");
  stateRef.current = state;

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    mediaRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run the frequency animation while recording/paused. This effect fires
  // after render, so the canvas is mounted by the time drawing starts.
  useEffect(() => {
    if ((state === "recording" || state === "paused") && analyserRef.current) {
      drawWave(analyserRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [state]);

  function drawWave(analyser: AnalyserNode) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(data);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const bars = 48;
      const step = Math.floor(data.length / bars);
      const barWidth = width / bars;
      for (let i = 0; i < bars; i += 1) {
        const value = data[i * step] / 255;
        const paused = stateRef.current === "paused";
        const barHeight = Math.max(4, value * height * (paused ? 0.06 : 0.85));
        const x = i * barWidth + barWidth * 0.2;
        const y = (height - barHeight) / 2;
        // Jade bars on the light panel background.
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#1fb489");
        gradient.addColorStop(1, "#11705a");
        ctx.fillStyle = paused ? "rgba(18, 138, 109, 0.25)" : gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth * 0.6, barHeight, 3);
        ctx.fill();
      }
    };
    render();
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setMicLabel(stream.getAudioTracks()[0]?.label || "Default microphone");

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      // Drawing starts in the state effect below — the canvas doesn't exist
      // yet at this point (it mounts when state leaves "idle").
      analyserRef.current = analyser;

      const { mime, ext } = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        setTakeDuration(elapsedRef.current);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
        onCaptured(blob, `consultation-${stamp}.${ext}`);
        cleanup();
      };
      recorder.start(1000);
      mediaRef.current = recorder;

      startedAtRef.current = Date.now();
      pausedTotalRef.current = 0;
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        if (stateRef.current === "recording") {
          setElapsed((Date.now() - startedAtRef.current - pausedTotalRef.current) / 1000);
        }
      }, 250);

      setState("recording");
      haptic("heavy"); // unmistakable "we are live" confirmation
    } catch {
      haptic("error");
      setError(
        "Microphone unavailable. Allow mic access in your browser, or upload an audio file instead.",
      );
    }
  }

  function togglePause() {
    const recorder = mediaRef.current;
    if (!recorder) return;
    haptic("medium");
    if (state === "recording") {
      recorder.pause();
      pauseStartRef.current = Date.now();
      setState("paused");
    } else if (state === "paused") {
      recorder.resume();
      pausedTotalRef.current += Date.now() - pauseStartRef.current;
      setState("recording");
    }
  }

  function stop() {
    haptic("heavy");
    mediaRef.current?.stop();
    setState("done");
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    setTakeDuration(0);
    setState("idle");
    onDiscarded();
  }

  return (
    <div className="rec-stage">
      {(state === "recording" || state === "paused") && (
        <div className="rec-wave">
          <canvas ref={canvasRef} width={560} height={84} />
        </div>
      )}

      {state !== "done" && (
        <div className={`rec-timer ${state === "recording" ? "rec-timer--live" : ""}`}>
          {formatDuration(elapsed)}
        </div>
      )}

      {state === "done" && previewUrl && (
        <AudioPlayer src={previewUrl} durationSec={takeDuration} />
      )}

      {micLabel && state !== "idle" && (
        <Badge tone="info" dot={state === "recording"} live={state === "recording"}>
          <Mic size={11} /> {micLabel}
        </Badge>
      )}

      <div className="rec-controls">
        {state === "idle" && (
          <button
            type="button"
            className="rec-mic-btn"
            onClick={() => void start()}
            disabled={disabled}
            aria-label="Start recording"
          >
            <Mic size={30} />
          </button>
        )}
        {(state === "recording" || state === "paused") && (
          <>
            <Button size="lg" onClick={togglePause}>
              {state === "paused" ? <Play size={18} /> : <Pause size={18} />}
              {state === "paused" ? "Resume" : "Pause"}
            </Button>
            <button
              type="button"
              className="rec-mic-btn rec-mic-btn--recording"
              onClick={stop}
              aria-label="Stop recording"
            >
              <Square size={26} fill="currentColor" />
            </button>
          </>
        )}
        {state === "done" && (
          <Button onClick={reset}>
            <RotateCcw size={16} /> Record again
          </Button>
        )}
      </div>

      {error ? (
        <p className="ui-field__error" style={{ textAlign: "center", maxWidth: 380 }}>
          {error}
        </p>
      ) : (
        <p className="rec-hint">
          {state === "idle" &&
            "Tap to record the consultation. Ask for consent before you begin."}
          {state === "recording" &&
            "Recording — speak naturally, the AI handles accents and mixed languages."}
          {state === "paused" && "Paused — resume when you're ready."}
          {state === "done" && "Review the take, then generate the note below."}
        </p>
      )}
    </div>
  );
}
