import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./Feedback";

/**
 * Route guard. Not logged in -> /login. Wrong role -> back to the dashboard.
 * (This only hides pages. The API enforces the real permissions.)
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
