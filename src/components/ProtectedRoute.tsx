import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  const needsProfile = !profile || !profile.phone?.trim() || !profile.name || profile.name === "مستخدم";
  if (needsProfile && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }
  return <>{children}</>;
}
