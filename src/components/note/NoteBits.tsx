/** Presentational atoms shared by the grid and SOAP renderings of a note. */
import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Activity,
  Droplets,
  FlaskConical,
  Gauge,
  HeartPulse,
  Plus,
  Thermometer,
  Weight,
  Wind,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type SectionTone = "jade" | "danger" | "accent" | "info";

export function NSec({
  icon,
  title,
  tone = "jade",
  tint,
  count,
  span = 6,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone?: SectionTone;
  /** Card background tint for high-attention sections. */
  tint?: "danger" | "saffron";
  count?: number;
  /** Width in the 12-column note layout. */
  span?: 3 | 4 | 5 | 6 | 7 | 12;
  children: ReactNode;
}) {
  const iconTone = tone === "jade" ? "" : `nsec__icon--${tone}`;
  return (
    <section className={`nsec nsec--s${span} ${tint ? `nsec--${tint}` : ""}`}>
      <div className="nsec__head">
        <span className={`nsec__icon ${iconTone}`}>{icon}</span>
        <span className="nsec__title">{title}</span>
        {count !== undefined && count > 0 && <span className="nsec__count">{count}</span>}
      </div>
      {/* Fixed-size card: overflowing content scrolls in here, never grows the card. */}
      <div className="nsec__body">{children}</div>
    </section>
  );
}

export function IRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="irow">
      <span className="irow__icon">{icon}</span>
      <span className="irow__k">{label}</span>
      <span className="irow__v">{value}</span>
    </div>
  );
}

export function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const r = 18;
  const c = 2 * Math.PI * r;
  const color =
    pct >= 75 ? "var(--green-500)" : pct >= 45 ? "var(--saffron-500)" : "var(--danger)";
  return (
    <div className="conf-ring" title={`AI extraction confidence: ${pct}%`}>
      {/* viewBox lets CSS shrink the ring on phones without cropping it. */}
      <svg
        width={44}
        height={44}
        viewBox="0 0 44 44"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={4.5}
        />
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 900ms var(--ease-out)" }}
        />
      </svg>
      <span className="conf-ring__val">{pct}%</span>
    </div>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="onb-chips">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="ui-chip ui-chip--static">
          {item}
        </span>
      ))}
    </div>
  );
}

export function ChipEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const value = input.trim();
    if (!value) return;
    onChange([...items, value]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  return (
    <div className="chip-editor">
      {items.length > 0 && (
        <div className="onb-chips">
          {items.map((item, i) => (
            <span key={`${item}-${i}`} className="ui-chip ui-chip--static">
              {item}
              <button
                type="button"
                className="ui-chip__x"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${item}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="chip-editor__add">
        <input
          className="ui-field__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        <Button size="sm" onClick={add} className="chip-editor__btn">
          <Plus size={14} /> Add
        </Button>
      </div>
    </div>
  );
}

/** Picks a meaningful icon for a vital from its name. */
export function VitalIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (/bp|pressure/.test(t)) return <Gauge size={14} />;
  if (/temp|fever/.test(t)) return <Thermometer size={14} />;
  if (/pulse|heart/.test(t)) return <HeartPulse size={14} />;
  if (/spo2|oxygen|sat/.test(t)) return <Droplets size={14} />;
  if (/weight|bmi/.test(t)) return <Weight size={14} />;
  if (/sugar|glucose|hba1c/.test(t)) return <FlaskConical size={14} />;
  if (/resp|breath/.test(t)) return <Wind size={14} />;
  return <Activity size={14} />;
}
