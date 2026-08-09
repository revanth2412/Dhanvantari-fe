/** Brand loader — an animated ECG heartbeat trace. */

export function EcgLoader({ label, size = 120 }: { label?: string; size?: number }) {
  return (
    <div className="ui-ecg" role="status" aria-label={label ?? "Loading"}>
      <svg width={size} height={size * 0.4} viewBox="0 0 120 48">
        <path
          className="ui-ecg__line"
          d="M2 26 H28 L36 12 L46 40 L56 8 L64 26 H86 L92 20 L98 26 H118"
        />
      </svg>
      {label && (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          {label}
        </p>
      )}
    </div>
  );
}

export function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="center-screen">
      <EcgLoader label={label} />
    </div>
  );
}
