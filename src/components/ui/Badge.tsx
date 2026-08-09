import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "ok" | "warn" | "danger" | "info" | "accent";

interface BadgeProps {
  tone?: BadgeTone;
  /** Show a status dot; `live` makes it pulse. */
  dot?: boolean;
  live?: boolean;
  children: ReactNode;
}

export function Badge({
  tone = "neutral",
  dot = false,
  live = false,
  children,
}: BadgeProps) {
  const toneClass = tone === "neutral" ? "" : `ui-badge--${tone}`;
  return (
    <span className={`ui-badge ${toneClass} ${live ? "ui-badge--live" : ""}`}>
      {(dot || live) && <span className="ui-badge__dot" aria-hidden />}
      {children}
    </span>
  );
}
