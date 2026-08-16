/**
 * The signature Dhanvantari heartbeat trace mark: a continuous ECG wave trace.
 * Used across the landing page, dashboard, sidebar, and identity badges.
 */
export function BrandMark({
  size = 32,
  className = "",
  title = "Dhanvantari",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`brandmark ${className}`}
      style={{ width: size, height: size }}
      title={title}
      aria-label={title}
    >
      <svg viewBox="0 0 40 24" aria-hidden fill="none">
        <path
          d="M2 12 H10 l3 -7 l4 13 l3 -6 h4 l2 -3 l3 6 h7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
