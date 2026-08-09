import { useAuth } from "@/hooks/useAuth";

/** Shown while the doctor's account is awaiting admin approval (or rejected). */
export function PendingApprovalPage() {
  const { doctor, status, refreshProfile, signOut } = useAuth();
  const rejected = status === "rejected";

  return (
    <div className="center-screen">
      <div className="card">
        <div className={`badge ${rejected ? "badge-danger" : "badge-warn"}`}>
          {rejected ? "Access declined" : "Pending approval"}
        </div>

        <h1 className="brand">
          {rejected ? "Your account isn't active" : "Almost there"}
        </h1>

        <p className="muted">
          {rejected ? (
            <>
              Your account (<strong>{doctor?.email}</strong>) is not currently active.
              Please contact your administrator.
            </>
          ) : (
            <>
              Thanks, <strong>{doctor?.full_name}</strong>. Your account is awaiting
              approval by an administrator. You'll get access as soon as it's reviewed.
            </>
          )}
        </p>

        <div className="row">
          <button type="button" className="btn" onClick={() => void refreshProfile()}>
            Refresh status
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
