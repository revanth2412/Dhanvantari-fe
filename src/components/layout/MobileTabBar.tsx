import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, LogOut, Mic, ShieldCheck, User, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { haptic } from "@/lib/haptics";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

function AccountSheet({ onClose }: { onClose: () => void }) {
  const { doctor, signOut } = useAuth();
  const isAdmin = doctor?.role === "admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Account">
        <span className="sheet__grabber" aria-hidden />
        <div className="sheet__head">
          <Avatar name={doctor?.full_name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>
              {doctor?.full_name}
            </div>
            <div
              className="muted"
              style={{ fontSize: "0.8rem", overflowWrap: "anywhere" }}
            >
              {doctor?.email}
            </div>
          </div>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </div>

        <div className="sheet__facts">
          <div className="pt-fact">
            <span className="pt-fact__k">Specialty</span>
            <span className="pt-fact__v">{doctor?.specialty ?? "—"}</span>
          </div>
          <div className="pt-fact">
            <span className="pt-fact__k">Registration</span>
            <span className="pt-fact__v">{doctor?.registration_no ?? "—"}</span>
          </div>
          <div className="pt-fact">
            <span className="pt-fact__k">Role</span>
            <span className="pt-fact__v">{isAdmin ? "Administrator" : "Doctor"}</span>
          </div>
        </div>

        <Button variant="danger-soft" block onClick={() => void signOut()}>
          <LogOut size={16} /> Sign out
        </Button>
      </div>
    </>,
    document.body,
  );
}

/**
 * Mobile-only bottom navigation: a floating rounded tab bar with a raised
 * record FAB, mirroring native app conventions. Hidden on desktop, where the
 * sidebar takes over (both live in the DOM; CSS decides which is visible).
 */
export function MobileTabBar() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const isAdmin = doctor?.role === "admin";

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `tabbar__item ${isActive ? "tabbar__item--active" : ""}`;

  return (
    <>
      <nav className="tabbar" aria-label="Primary">
        <NavLink to="/" end className={itemClass} onClick={() => haptic("selection")}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/patients" className={itemClass} onClick={() => haptic("selection")}>
          <Users size={20} />
          <span>Patients</span>
        </NavLink>

        <button
          type="button"
          className="tabbar__fab"
          aria-label="New consultation"
          onClick={() => {
            haptic("medium");
            navigate("/consultations/new");
          }}
        >
          <Mic size={22} />
        </button>

        {isAdmin ? (
          <NavLink to="/admin" className={itemClass} onClick={() => haptic("selection")}>
            <ShieldCheck size={20} />
            <span>Approve</span>
          </NavLink>
        ) : (
          <span className="tabbar__item tabbar__item--spacer" aria-hidden />
        )}

        <button
          type="button"
          className="tabbar__item"
          onClick={() => {
            haptic("selection");
            setAccountOpen(true);
          }}
        >
          <User size={20} />
          <span>Account</span>
        </button>
      </nav>

      {accountOpen && <AccountSheet onClose={() => setAccountOpen(false)} />}
    </>
  );
}
