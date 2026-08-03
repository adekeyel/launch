import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

// Wrap a route element: <ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>
// role can be a string or an array of allowed roles; omit it to just require login.
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader label="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Not available for your account</h1>
        <p className="mt-2 text-sm text-ink/60">
          This page is only for {allowedRoles.join(" or ")} accounts. You're signed in as {user.role}.
        </p>
      </div>
    );
  }

  return children;
}
