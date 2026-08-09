import { useAuth } from "@/hooks/useAuth";

/**
 * Placeholder home for approved doctors. The consultation flow
 * (patients -> consultation -> upload -> review) will be built here later.
 */
export function DashboardPage() {
  const { doctor, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand-sm">Dhanvantari</span>
        <div className="topbar-right">
          <span className="muted">
            {doctor?.full_name}
            {doctor?.role === "admin" ? " · admin" : ""}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <h1>Welcome, {doctor?.full_name} 👋</h1>
        <p className="muted">
          You're approved. The consultation workflow will appear here next.
        </p>
      </main>
    </div>
  );
}
