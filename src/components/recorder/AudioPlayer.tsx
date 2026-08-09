import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { formatDuration } from "@/lib/format";

interface AudioPlayerProps {
  src: string;
  /** Real clip length in seconds — freshly recorded MediaRecorder blobs report
   * `Infinity` to the browser, so the caller supplies the known duration. */
  durationSec: number;
}

/** Design-system playback player: round play button, seek bar, mm:ss / mm:ss. */
export function AudioPlayer({ src, durationSec }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSec);

  useEffect(() => {
    setDuration(durationSec);
    setCurrent(0);
    setPlaying(false);
  }, [src, durationSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      // Chrome quirk: recorded webm has no duration metadata (Infinity).
      // Seeking far past the end forces the real duration to resolve, which
      // also makes the seek bar work reliably.
      if (!Number.isFinite(audio.duration)) {
        const fix = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
          audio.currentTime = 0;
          audio.removeEventListener("timeupdate", fix);
        };
        audio.addEventListener("timeupdate", fix);
        audio.currentTime = 1e10;
      } else if (audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => {
      if (audio.currentTime <= (Number.isFinite(audio.duration) ? audio.duration : 1e9)) {
        setCurrent(audio.currentTime);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true));
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  const total = duration > 0 ? duration : durationSec;
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="player__btn"
        onClick={toggle}
        aria-label={playing ? "Pause playback" : "Play recording"}
      >
        {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>
      <input
        type="range"
        className="player__track"
        min={0}
        max={total}
        step={0.1}
        value={Math.min(current, total)}
        onChange={(e) => seek(Number(e.target.value))}
        style={{ "--fill": `${pct}%` } as CSSProperties}
        aria-label="Seek"
      />
      <span className="player__time">
        {formatDuration(current)} / {formatDuration(total)}
      </span>
    </div>
  );
}
