import { Suspense, type SyntheticEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Mic,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { EcgLoader } from "@/components/ui/EcgLoader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ClinicGate } from "@/components/clinic/ClinicGate";

/** The sidebar expands on hover AND :focus-within; a clicked link keeps focus,
 * which would pin it open after the pointer leaves — so blur on click. */
function releaseFocus(e?: SyntheticEvent<HTMLElement>) {
  if (e) {
    e.currentTarget.blur();
  }
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
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
      <aside className="shell__sidebar" aria-label="Main Navigation">
        <div className="side-brand">
          <BrandMark size={32} className="side-brand__icon" />
          <span className="side-brand__name side-label">
            MediVaani<b>AI</b>
          </span>
        </div>

        <div className="side-rec">
          <Button
            variant="primary"
            size="md"
            className="side-rec__btn"
            title="Start Consultation"
            onClick={(e) => {
              releaseFocus(e);
              navigate("/consultations/new");
            }}
          >
            <Mic size={18} /> <span className="side-label">Consultation</span>
          </Button>
        </div>

        <nav className="side-nav">
          <NavLink
            to="/dashboard"
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
          <NavLink
            to="/clinic"
            className={linkClass}
            title="Clinic"
            onClick={releaseFocus}
          >
            <Building2 size={18} /> <span className="side-label">Clinic</span>
          </NavLink>
          {isAdmin && (
            <>
              <div className="side-nav__section side-label">Manage</div>
              <NavLink
                to="/admin"
                className={linkClass}
                title="Administration"
                onClick={releaseFocus}
              >
                <ShieldCheck size={18} />{" "}
                <span className="side-label">Administration</span>
              </NavLink>
            </>
          )}
        </nav>

        <div
          className="side-user side-user--profile"
          role="button"
          tabIndex={0}
          title="Open doctor profile settings"
          onClick={(e) => {
            releaseFocus(e);
            navigate("/profile");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              releaseFocus();
              navigate("/profile");
            }
          }}
        >
          <Avatar name={doctor?.full_name} size={32} />
          <div className="side-user__meta side-label">
            <div className="side-user__name">{doctor?.full_name}</div>
            <div className="side-user__sub">
              {doctor?.specialty ?? (isAdmin ? "Administrator" : "Doctor")}
            </div>
          </div>
          <div className="side-user__actions side-label">
            <button
              type="button"
              className="side-user__out"
              title="Doctor Settings"
              onClick={(e) => {
                e.stopPropagation();
                releaseFocus(e);
                navigate("/profile");
              }}
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              className="side-user__out side-user__out--logout"
              title="Sign out"
              onClick={(e) => {
                e.stopPropagation();
                releaseFocus(e);
                void signOut();
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="shell__main">
        {/* Blocks the workspace if this clinic (or this membership) was revoked,
            offering a switch to another clinic the doctor still belongs to. */}
        <ClinicGate>
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
        </ClinicGate>
      </div>

      <MobileTabBar />
    </div>
  );
}
