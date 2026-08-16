import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  Headphones,
  Home,
  LogOut,
  Mic,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { haptic } from "@/lib/haptics";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

function AccountSheet({ onClose }: { onClose: () => void }) {
  const { doctor, signOut } = useAuth();
  const navigate = useNavigate();
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
            <span className="pt-fact__k">Clinic</span>
            <span className="pt-fact__v">{doctor?.clinic_name ?? "Not set up"}</span>
          </div>
          <div className="pt-fact">
            <span className="pt-fact__k">Role</span>
            <span className="pt-fact__v">{isAdmin ? "Administrator" : "Doctor"}</span>
          </div>
        </div>

        <Button
          block
          onClick={() => {
            onClose();
            navigate("/profile");
          }}
        >
          <User size={16} /> Edit profile
        </Button>

        {/* Admins reach the console here — the tab bar slot is the Clinic page. */}
        {isAdmin && (
          <Button
            block
            onClick={() => {
              onClose();
              navigate("/admin");
            }}
          >
            <ShieldCheck size={16} /> Admin console
          </Button>
        )}

        <Button
          block
          onClick={() => {
            onClose();
            navigate("/contact");
          }}
        >
          <Headphones size={16} /> Support &amp; Contact
        </Button>

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
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `tabbar__item ${isActive ? "tabbar__item--active" : ""}`;

  return (
    <>
      <nav className="tabbar" aria-label="Primary">
        <NavLink
          to="/dashboard"
          className={itemClass}
          onClick={() => haptic("selection")}
        >
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

        <NavLink to="/clinic" className={itemClass} onClick={() => haptic("selection")}>
          <Building2 size={20} />
          <span>Clinic</span>
        </NavLink>

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
