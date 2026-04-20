import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "../features/shared/Shell.js";
import { LoginPage } from "../features/auth/LoginPage.js";
import { UploadPage } from "../features/customer-upload/UploadPage.js";
import { ReviewQueuePage } from "../features/admin-review/ReviewQueuePage.js";
import { ReviewDetailPage } from "../features/admin-review/ReviewDetailPage.js";
import { TrackingPage } from "../features/tracking/TrackingPage.js";
import { getRoleHomePath } from "../features/auth/role-home.js";
import { useAuth } from "../features/auth/useAuth.js";

function SessionGate() {
  return (
    <section className="card">
      <p className="eyebrow">Auth</p>
      <h1>Checking session</h1>
      <p className="muted">
        Verifying your signed-in state before opening the next screen.
      </p>
    </section>
  );
}

function HomeRoute() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <SessionGate />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to={getRoleHomePath(user.role)} />;
}

function ProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: "customer" | "admin";
  children: ReactElement;
}) {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <SessionGate />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.role !== allowedRole) {
    return <Navigate replace to={getRoleHomePath(user.role)} />;
  }

  return children;
}

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/customer/upload"
          element={
            <ProtectedRoute allowedRole="customer">
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/tracking"
          element={
            <ProtectedRoute allowedRole="customer">
              <TrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute allowedRole="admin">
              <ReviewQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews/:submissionId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ReviewDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Shell>
  );
}
