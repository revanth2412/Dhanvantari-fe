import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, radius, style }: SkeletonProps) {
  return (
    <span
      className="ui-skeleton"
      style={{ display: "block", width, height, borderRadius: radius, ...style }}
      aria-hidden
    />
  );
}

/** A stack of shimmering rows — drop-in placeholder for lists/tables. */
export function SkeletonRows({
  rows = 4,
  height = 44,
}: {
  rows?: number;
  height?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} radius={10} />
      ))}
    </div>
  );
}
