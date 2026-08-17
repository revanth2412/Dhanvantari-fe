import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AuthStatus } from "@/context/authContext";
import { FullScreenLoader } from "@/components/ui/EcgLoader";
import { AppLayout } from "@/components/layout/AppLayout";
// Every route is code-split, so the entry chunk is just the shell, the auth
// bootstrap and the router. Each page then pulls only the CSS, icons and
// animation code it actually uses — the login chunk, for instance, downloads
// during the session check that already blocks the first paint.
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
// Picks the phone or desktop landing tree; only the chosen one is downloaded.
const LandingPage = lazy(() =>
  import("@/pages/landing/LandingRoute").then((m) => ({ default: m.LandingRoute })),
);
const RegisterProfilePage = lazy(() =>
  import("@/pages/RegisterProfilePage").then((m) => ({
    default: m.RegisterProfilePage,
  })),
);
const AccessRevokedPage = lazy(() =>
  import("@/pages/AccessRevokedPage").then((m) => ({ default: m.AccessRevokedPage })),
);
const SelectClinicPage = lazy(() =>
  import("@/pages/SelectClinicPage").then((m) => ({ default: m.SelectClinicPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const PatientsPage = lazy(() =>
  import("@/pages/PatientsPage").then((m) => ({ default: m.PatientsPage })),
);
const PatientDetailPage = lazy(() =>
  import("@/pages/PatientDetailPage").then((m) => ({ default: m.PatientDetailPage })),
);
const NewConsultationPage = lazy(() =>
  import("@/pages/NewConsultationPage").then((m) => ({
    default: m.NewConsultationPage,
  })),
);
const ConsultationSessionPage = lazy(() =>
  import("@/pages/ConsultationSessionPage").then((m) => ({
    default: m.ConsultationSessionPage,
  })),
);
const AdminPage = lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const ClinicPage = lazy(() =>
  import("@/pages/ClinicPage").then((m) => ({ default: m.ClinicPage })),
);
const ContactPage = lazy(() =>
  import("@/pages/ContactPage").then((m) => ({ default: m.ContactPage })),
);

/** The single place each auth status is allowed to be. */
function homePathFor(status: AuthStatus): string {
  switch (status) {
    case "unauthenticated":
      return "/login";
    case "unregistered":
      return "/register-profile";
    case "revoked":
      return "/access-revoked";
    case "no_clinic":
      return "/select-clinic";
    case "approved":
      return "/";
    default:
      return "/login";
  }
}

/** Renders `element` only when the status matches; otherwise redirects home. */
function RouteFor({
  allow,
  status,
  element,
}: {
  allow: AuthStatus[];
  status: AuthStatus;
  element: ReactNode;
}) {
  if (allow.includes(status)) return <>{element}</>;
  return <Navigate to={homePathFor(status)} replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { doctor } = useAuth();
  if (doctor?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function WorkspaceHome() {
  const { doctor } = useAuth();
  return <Navigate to={doctor?.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullScreenLoader />;
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/login"
          element={
            <RouteFor
              allow={["unauthenticated"]}
              status={status}
              element={<LoginPage />}
            />
          }
        />
        <Route
          path="/register-profile"
          element={
            <RouteFor
              allow={["unregistered"]}
              status={status}
              element={<RegisterProfilePage />}
            />
          }
        />
        <Route
          path="/access-revoked"
          element={
            <RouteFor
              allow={["revoked"]}
              status={status}
              element={<AccessRevokedPage />}
            />
          }
        />
        <Route
          path="/select-clinic"
          element={
            <RouteFor
              allow={["no_clinic"]}
              status={status}
              element={<SelectClinicPage />}
            />
          }
        />
        <Route
          path="/"
          element={
            status === "unauthenticated" ? (
              <LandingPage />
            ) : (
              <RouteFor allow={["approved"]} status={status} element={<AppLayout />} />
            )
          }
        >
          <Route index element={<WorkspaceHome />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="clinic" element={<ClinicPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:patientId" element={<PatientDetailPage />} />
          <Route path="consultations/new" element={<NewConsultationPage />} />
          <Route
            path="consultations/:consultationId"
            element={<ConsultationSessionPage />}
          />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={homePathFor(status)} replace />} />
      </Routes>
    </Suspense>
  );
}
