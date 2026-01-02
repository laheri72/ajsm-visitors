import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../models/UserRole";
import type { JSX } from "react/jsx-dev-runtime";

interface Props {
  children: JSX.Element;
  allow: UserRole[];
}

export default function ProtectedRoute({ children, allow }: Props) {
  const { user, role, loading } = useAuth();

  if (loading) return <p>Checking access...</p>;

  if (!user || !role || !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
