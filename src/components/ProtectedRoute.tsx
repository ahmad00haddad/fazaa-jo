import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isValidJordanPhone } from "@/lib/phone";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  
  // 1) انتظر انتهاء التحميل فعلاً
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  
  // 2) لا جلسة → صفحة الدخول
  if (!session) return <Navigate to={`/auth?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  
  // 3) جلسة بلا ملف (أو ملف غير مكتمل) → إكمال البيانات
  const needsProfile =
    !profile ||
    !profile.name ||
    profile.name === "مستخدم" ||
    !isValidJordanPhone(profile.phone ?? "");
    
  if (needsProfile && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }
  
  // 4) كل شيء جاهز
  return <>{children}</>;
}
