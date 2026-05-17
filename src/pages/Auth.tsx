import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Mode = "login" | "signup";

export default function Auth() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim() || !phone.trim() || !email.trim() || password.length < 6) {
          toast.error("جميع الحقول مطلوبة، وكلمة السر 6 أحرف فأكثر");
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: name.trim(), phone: phone.trim(), gender },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب");
        nav("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("أهلاً بعودتك");
        nav("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر الدخول عبر Google");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[420px] rounded-3xl bg-card shadow-elevated p-6">
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl font-extrabold">فزعة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "سجّل دخولك للوصول إلى الفزعات" : "أنشئ حساباً جديداً"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 bg-secondary rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 text-sm rounded-xl font-semibold ${mode === "login" ? "bg-card shadow" : ""}`}
          >
            دخول
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-2 text-sm rounded-xl font-semibold ${mode === "signup" ? "bg-card shadow" : ""}`}
          >
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="رقم الهاتف (مخفي عن الآخرين)"
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-3 rounded-2xl text-sm font-semibold ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-3 rounded-2xl text-sm font-semibold ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  أنثى
                </button>
              </div>
            </>
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="البريد الإلكتروني"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="كلمة السر"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        {mode === "signup" && (
          <p className="text-[11px] text-muted-foreground mt-4 leading-5 text-center">
            رقم هاتفك مخفي تماماً. لن يظهر إلا لصاحب الفزعة بعد قبولك للتلبية، ولن يظهر رقم صاحبة الفزعة لأحد — هي من تبدأ التواصل.
          </p>
        )}
      </div>
    </div>
  );
}
