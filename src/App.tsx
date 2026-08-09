import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AuthStatus } from "@/context/authContext";
import { FullScreenSpinner } from "@/components/Spinner";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterProfilePage } from "@/pages/RegisterProfilePage";
import { PendingApprovalPage } from "@/pages/PendingApprovalPage";
import { DashboardPage } from "@/pages/DashboardPage";

/** The single place each auth status is allowed to be. */
function homePathFor(status: AuthStatus): string {
  switch (status) {
    case "unauthenticated":
      return "/login";
    case "unregistered":
      return "/register-profile";
    case "pending":
    case "rejected":
      return "/pending";
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

export default function App() {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullScreenSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RouteFor allow={["unauthenticated"]} status={status} element={<LoginPage />} />
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
        path="/pending"
        element={
          <RouteFor
            allow={["pending", "rejected"]}
            status={status}
            element={<PendingApprovalPage />}
          />
        }
      />
      <Route
        path="/"
        element={
          <RouteFor allow={["approved"]} status={status} element={<DashboardPage />} />
        }
      />
      <Route path="*" element={<Navigate to={homePathFor(status)} replace />} />
    </Routes>
  );
}
