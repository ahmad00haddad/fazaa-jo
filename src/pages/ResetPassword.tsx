import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // When the user lands here from the email link, Supabase puts
  // #access_token=...&type=recovery in the URL hash. The client
  // automatically exchanges it for a session, so we just wait for
  // the auth state to settle and verify we have a real session.
  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
      }
    });
    // Initial check in case the event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setReady(true);
      }
      setChecking(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      toast.error("كلمة السر يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("تم تعيين كلمة السر بنجاح!");
      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();
      nav("/auth", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر تحديث كلمة السر");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-[420px] rounded-3xl bg-card shadow-elevated p-6 text-center">
          <div className="w-14 h-14 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-extrabold mb-2">رابط غير صالح أو منتهي</h1>
          <p className="text-sm text-muted-foreground leading-6 mb-5">
            الرابط اللي وصلت فيه منتهي الصلاحية أو تم استخدامه. اطلب رابط جديد من صفحة تسجيل الدخول.
          </p>
          <button
            type="button"
            onClick={() => nav("/auth", { replace: true })}
            className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[420px] rounded-3xl bg-card shadow-elevated p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3 border border-primary/20">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-extrabold">تعيين كلمة سر جديدة</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-6">
            أدخل كلمة سر جديدة لحسابك. كلمة السر لازم تكون 6 أحرف على الأقل.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="كلمة السر الجديدة"
              className="w-full rounded-2xl bg-secondary px-11 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              placeholder="تأكيد كلمة السر"
              className="w-full rounded-2xl bg-secondary px-11 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !password || !confirm}
            className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            حفظ كلمة السر
          </button>
        </form>
      </div>
    </div>
  );
}
