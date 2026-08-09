/**
 * The Dhanvantari mark: a heartbeat trace that keeps running.
 * Used as the app's identity badge where the sidebar brand isn't visible
 * (i.e. the mobile header).
 */
export function BrandMark({
  size = 34,
  title = "Dhanvantari",
}: {
  size?: number;
  title?: string;
}) {
  return (
    <span className="brandmark" style={{ width: size, height: size }} title={title}>
      <svg viewBox="0 0 40 24" aria-hidden>
        <path d="M2 12 H10 l3 -7 l4 13 l3 -6 h4 l2 -3 l3 6 h7" />
      </svg>
    </span>
  );
}
