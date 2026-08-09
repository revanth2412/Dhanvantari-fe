import { Suspense, type SyntheticEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, LogOut, Mic, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EcgLoader } from "@/components/ui/EcgLoader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";

/** The sidebar expands on hover AND :focus-within; a clicked link keeps focus,
 * which would pin it open after the pointer leaves — so blur on click. */
function releaseFocus(e: SyntheticEvent<HTMLElement>) {
  e.currentTarget.blur();
}

/** Approved-area shell: auto-collapsing evergreen sidebar + routed page.
 * No topbar — pages own their headers, keeping the full height for content. */
export function AppLayout() {
  const { doctor, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = doctor?.role === "admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `side-link ${isActive ? "side-link--active" : ""}`;

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="side-brand">
          <Activity size={22} color="#22c99d" />
          <span className="side-label">
            Dhanvantari
            <small>AI Clinical Scribe</small>
          </span>
        </div>

        <div className="side-cta">
          <Button
            variant="primary"
            block
            onClick={(e) => {
              releaseFocus(e);
              navigate("/consultations/new");
            }}
          >
            <Mic size={16} /> <span className="side-label">New consultation</span>
          </Button>
        </div>

        <nav className="side-nav">
          <NavLink
            to="/"
            end
            className={linkClass}
            title="Dashboard"
            onClick={releaseFocus}
          >
            <LayoutDashboard size={18} /> <span className="side-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/patients"
            className={linkClass}
            title="Patients"
            onClick={releaseFocus}
          >
            <Users size={18} /> <span className="side-label">Patients</span>
          </NavLink>
          {isAdmin && (
            <>
              <div className="side-nav__section side-label">Manage</div>
              <NavLink
                to="/admin"
                className={linkClass}
                title="Approvals"
                onClick={releaseFocus}
              >
                <ShieldCheck size={18} /> <span className="side-label">Approvals</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="side-user">
          <Avatar name={doctor?.full_name} size={32} />
          <div className="side-user__meta side-label">
            <div className="side-user__name">{doctor?.full_name}</div>
            <div className="side-user__sub">
              {doctor?.specialty ?? (isAdmin ? "Administrator" : "Doctor")}
            </div>
          </div>
          <button
            type="button"
            className="side-user__out side-label"
            title="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <Suspense
          fallback={
            <div
              className="page"
              style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}
            >
              <EcgLoader label="Loading…" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>

      <MobileTabBar />
    </div>
  );
}
