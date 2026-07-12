import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatJordanPhoneDisplay,
  isValidJordanPhone,
  normalizeJordanPhone,
} from "@/lib/phone";

export default function CompleteProfile() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(
        profile.name && profile.name !== "مستخدم"
          ? profile.name
          : (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""),
      );
      setPhone(profile.phone ?? "");
      setGender((profile.gender as "male" | "female") ?? "male");
    }
  }, [profile, user]);

  const normalized = useMemo(() => normalizeJordanPhone(phone), [phone]);
  const phoneValid = isValidJordanPhone(phone);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (
    profile &&
    profile.name &&
    profile.name !== "مستخدم" &&
    isValidJordanPhone(profile.phone ?? "")
  ) {
    return <Navigate to="/" replace />;
  }

  const save = async () => {
    if (busy) return;
    if (!name.trim()) return toast.error("الاسم مطلوب");
    if (!phoneValid) return toast.error("أدخل رقماً أردنياً صحيحاً (مثال: 0791234567)");
    setBusy(true);
    try {
      const { error } = await supabase.rpc("complete_my_profile", {
        p_name: name.trim(),
        p_gender: gender,
        p_phone: normalized
      });
      if (error) throw error;
      await refreshProfile();
      toast.success("تم حفظ بياناتك");
      nav("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[420px] rounded-3xl bg-card shadow-elevated p-6">
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl font-extrabold">أكمل بياناتك</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-6">
            نحتاج رقم الواتساب لكي يصلك التواصل عند قبول الفزعة. رقمك يبقى مخفياً.
          </p>
          {user.email && (
            <p className="text-xs text-muted-foreground mt-2" dir="ltr">{user.email}</p>
          )}
        </div>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="رقم الواتساب (مثال: 0791234567)"
              className={`w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary ${
                phone && !phoneValid ? "ring-2 ring-destructive" : ""
              }`}
              dir="ltr"
            />
            {phone && (
              <p className="text-[11px] mt-1.5 text-muted-foreground px-1" dir="ltr">
                {phoneValid
                  ? `✓ ${formatJordanPhoneDisplay(phone)}`
                  : "رقم غير صالح — استخدم رقم أردني (يبدأ بـ 07)"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`py-3 rounded-2xl text-sm font-semibold ${
                gender === "male" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              ذكر
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`py-3 rounded-2xl text-sm font-semibold ${
                gender === "female" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              أنثى
            </button>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={busy || !phoneValid || !name.trim()}
            className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            حفظ والمتابعة
          </button>
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            nav("/auth", { replace: true });
          }}
          className="w-full mt-3 rounded-2xl bg-secondary py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج واستخدام حساب آخر
        </button>
      </div>
    </div>
  );
}
