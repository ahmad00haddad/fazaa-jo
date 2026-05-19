import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, LogOut, MessageCircleMore, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildJordanWhatsAppUrl,
  formatJordanPhoneDisplay,
  generateVerificationCode,
  isValidJordanPhone,
  normalizeJordanPhone,
} from "@/lib/phone";
import { confirmPhoneVerification, createPhoneVerification } from "@/lib/fazaa";

export default function CompleteProfile() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [busy, setBusy] = useState(false);

  // verification state
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState<string>("");
  const [enteredCode, setEnteredCode] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name && profile.name !== "مستخدم" ? profile.name : (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""));
      setPhone(profile.phone ?? "");
      setGender((profile.gender as "male" | "female") ?? "male");
      if (profile.phone_verified) setVerifiedPhone(profile.phone);
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
  if (profile && profile.phone && profile.phone.trim() && profile.name && profile.name !== "مستخدم" && profile.phone_verified) {
    return <Navigate to="/" replace />;
  }

  const startVerification = async () => {
    if (busy) return;
    if (!name.trim()) return toast.error("الاسم مطلوب");
    if (!phoneValid) return toast.error("أدخل رقماً أردنياً صحيحاً (مثال: 0791234567)");
    setBusy(true);
    try {
      // Save profile first (so RLS allows insert)
      const { error: upErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, name: name.trim(), phone: normalized, gender });
      if (upErr) throw upErr;
      await refreshProfile();
      const newCode = generateVerificationCode();
      await createPhoneVerification(user.id, normalized, newCode);
      setCode(newCode);
      setStep("verify");
      toast.success("تم إرسال رمز التحقق. افتح واتساب لتراه.");
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر إرسال الرمز");
    } finally {
      setBusy(false);
    }
  };

  const openWhatsAppForCode = () => {
    const msg = `رمز التحقق الخاص بك في فزعة: ${code}\nلا تشاركه مع أحد.`;
    window.open(buildJordanWhatsAppUrl(normalized, msg), "_blank");
  };

  const confirmCode = async () => {
    if (busy) return;
    if (enteredCode.trim().length !== 6) return toast.error("الرمز 6 أرقام");
    setBusy(true);
    try {
      const ok = await confirmPhoneVerification(user.id, normalized, enteredCode.trim());
      if (!ok) {
        toast.error("الرمز غير صحيح أو منتهي. جرّب مجدداً.");
        return;
      }
      setVerifiedPhone(normalized);
      await refreshProfile();
      toast.success("تم تأكيد رقمك بنجاح");
      nav("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر التحقق");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[420px] rounded-3xl bg-card shadow-elevated p-6">
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl font-extrabold">
            {step === "form" ? "أكمل بياناتك" : "تأكيد رقم واتساب"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "form"
              ? "نحتاج رقم هاتفك للتواصل عند قبول الفزعة (يبقى مخفياً)"
              : "افتح واتساب على هذا الرقم وأرسل الرمز ثم أدخله هنا"}
          </p>
          {user.email && (
            <p className="text-xs text-muted-foreground mt-2" dir="ltr">{user.email}</p>
          )}
        </div>

        {step === "form" && (
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
                  {phoneValid ? `✓ ${formatJordanPhoneDisplay(phone)}` : "رقم غير صالح — استخدم رقم أردني (يبدأ بـ 07)"}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setGender("male")} className={`py-3 rounded-2xl text-sm font-semibold ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>ذكر</button>
              <button type="button" onClick={() => setGender("female")} className={`py-3 rounded-2xl text-sm font-semibold ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>أنثى</button>
            </div>
            <button
              type="button"
              onClick={startVerification}
              disabled={busy || !phoneValid || !name.trim()}
              className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <ShieldCheck className="w-4 h-4" />
              تأكيد الرقم عبر واتساب
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-primary/10 text-primary p-4 text-center">
              <div className="text-xs opacity-80">رمز التحقق الخاص بك</div>
              <div className="font-display text-3xl font-extrabold tracking-[0.5em] mt-1" dir="ltr">
                {code}
              </div>
            </div>
            <ol className="text-xs text-muted-foreground leading-6 list-decimal pr-4 space-y-1">
              <li>اضغط الزر أدناه لفتح واتساب على رقمك ({formatJordanPhoneDisplay(normalized)}).</li>
              <li>أرسل الرسالة لنفسك (ستجدها مكتوبة جاهزة).</li>
              <li>ارجع هنا وأدخل الرمز الذي وصلك.</li>
            </ol>
            <button
              type="button"
              onClick={openWhatsAppForCode}
              className="w-full rounded-2xl bg-[#25D366] text-white py-3 font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircleMore className="w-4 h-4" />
              افتح واتساب وأرسل الرمز
            </button>
            <input
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="أدخل الرمز المكوّن من 6 أرقام"
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
              maxLength={6}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={confirmCode}
              disabled={busy || enteredCode.length !== 6}
              className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              تأكيد الرمز
            </button>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full rounded-2xl bg-secondary py-3 text-sm font-semibold"
            >
              تعديل الرقم
            </button>
            {verifiedPhone && (
              <p className="text-[11px] text-emerald-700 text-center">رقمك موثّق ✓</p>
            )}
          </div>
        )}

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
