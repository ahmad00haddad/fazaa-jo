import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  ChevronRight,
  UserPlus,
  LogIn,
  ShieldCheck,
  KeyRound,
  ArrowRight,
} from "lucide-react";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const { session, user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      if (mode === "signup") {
        if (!email.trim() || password.length < 6) {
          toast.error("البريد الإلكتروني مطلوب، وكلمة السر يجب أن تكون 6 أحرف على الأقل");
          setBusy(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: "مستخدم جديد", gender: "male" },
          },
        });

        if (error) throw error;

        if (!data.session) {
          toast.success("تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.");
          setMode("login");
        } else {
          toast.success("أهلاً بك في فزعة!");
          nav("/", { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login")) {
            throw new Error("البريد الإلكتروني أو كلمة السر غير صحيحة");
          }
          throw error;
        }

        toast.success("أهلاً بعودتك!");
        nav("/", { replace: true });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err?.message ?? "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      toast.error("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success("تم إرسال رابط تعيين كلمة السر إلى بريدك الإلكتروني");
    } catch (err: any) {
      console.error("Reset password error:", err);
      toast.error(err?.message ?? "تعذر إرسال رابط تعيين كلمة السر");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: "select_account",
        },
      });

      if (result.error) throw result.error;
      if (result.redirected) return;

      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر الدخول عبر حساب جوجل");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-5 overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div
        className={`w-full max-w-[420px] rounded-[2rem] bg-card/80 backdrop-blur-xl border border-white/5 shadow-2xl p-8 relative z-10 transition-all duration-700 ease-out ${isMounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            {mode === "forgot" ? (
              <KeyRound className="w-8 h-8 text-primary" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="font-display text-3xl font-extrabold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {mode === "forgot" ? "نسيت كلمة المرور" : "فزعة"}
          </h1>
          {mode !== "forgot" && (
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {mode === "login" ? "سجّل دخولك للوصول إلى مجتمع الفزعات" : "انضم إلينا بخطوة واحدة بسيطة"}
            </p>
          )}
        </div>

        {mode !== "forgot" && (
          <div className="flex p-1 bg-secondary/50 rounded-2xl mb-8 border border-white/5 relative">
            <div
              className="absolute inset-y-1 w-[calc(50%-4px)] bg-card rounded-xl shadow-sm transition-transform duration-300 ease-out"
              style={{
                transform: mode === "login" ? "translateX(0)" : "translateX(calc(-100% - 8px))",
                right: "4px",
              }}
            />
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${mode === "login" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${mode === "signup" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              حساب جديد
            </button>
          </div>
        )}

        {mode === "forgot" ? (
          <>
            {forgotSent ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <Mail className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-sm text-foreground/90 leading-6">
                  أرسلنا رابط تعيين كلمة السر إلى
                  <br />
                  <span className="font-bold" dir="ltr">
                    {email}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  تحقق من صندوق الوارد (والبريد المزعج). الرابط صالح لمدة ساعة.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForgotSent(false);
                  }}
                  className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold flex items-center justify-center gap-2 mt-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center leading-6">
                  أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة سر جديدة.
                </p>
                <div className="relative group">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="البريد الإلكتروني"
                    className="w-full rounded-2xl bg-secondary/30 border border-white/5 px-11 py-4 text-sm outline-none focus:bg-secondary/50 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                    dir="ltr"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="w-full rounded-2xl gradient-hero py-4 text-primary-foreground font-display font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
                >
                  {busy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      إرسال الرابط <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 mt-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  العودة لتسجيل الدخول
                </button>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-3 transition-all duration-300">
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-2xl bg-secondary/30 border border-white/5 px-11 py-4 text-sm outline-none focus:bg-secondary/50 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  dir="ltr"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="كلمة السر"
                  className="w-full rounded-2xl bg-secondary/30 border border-white/5 px-11 py-4 text-sm outline-none focus:bg-secondary/50 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  dir="ltr"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setMode("forgot");
                  }}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !email || password.length < 6}
              className="w-full rounded-2xl gradient-hero py-4 text-primary-foreground font-display font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "login" ? (
                <>
                  دخول <LogIn className="w-5 h-5" />
                </>
              ) : (
                <>
                  إنشاء الحساب <UserPlus className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {mode !== "forgot" && (
          <>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">أو</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-2xl bg-secondary/50 border border-white/5 hover:bg-secondary py-4 font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>المتابعة عبر حساب Google</span>
            </button>

            {mode === "signup" && (
              <p className="text-[11px] text-muted-foreground/80 mt-6 text-center leading-relaxed">
                من خلال إنشاء الحساب، أنت توافق على شروط الاستخدام. سيُطلب منك استكمال بياناتك الشخصية في الخطوة التالية.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
