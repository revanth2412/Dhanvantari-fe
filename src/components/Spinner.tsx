export function FullScreenSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="center-screen">
      <div className="spinner" aria-hidden />
      <p className="muted">{label}</p>
    </div>
  );
}
