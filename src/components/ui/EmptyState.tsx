import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <div className="ui-empty__icon">{icon}</div>
      <div className="ui-empty__title">{title}</div>
      {message && <p style={{ maxWidth: 380, fontSize: "0.9rem" }}>{message}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
