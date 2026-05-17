import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function CompleteProfile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name && profile.name !== "مستخدم" ? profile.name : (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""));
      setPhone(profile.phone ?? "");
      setGender((profile.gender as "male" | "female") ?? "male");
    }
  }, [profile, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (profile && profile.phone && profile.phone.trim() && profile.name && profile.name !== "مستخدم") {
    return <Navigate to="/" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim() || !phone.trim()) {
      toast.error("الاسم ورقم الهاتف مطلوبان");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, name: name.trim(), phone: phone.trim(), gender });
      if (error) throw error;
      await refreshProfile();
      toast.success("تم حفظ بياناتك");
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[420px] rounded-3xl bg-card shadow-elevated p-6">
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl font-extrabold">أكمل بياناتك</h1>
          <p className="text-sm text-muted-foreground mt-1">نحتاج رقم هاتفك للتواصل عند قبول الفزعة (يبقى مخفياً)</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="رقم الهاتف" className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setGender("male")} className={`py-3 rounded-2xl text-sm font-semibold ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>ذكر</button>
            <button type="button" onClick={() => setGender("female")} className={`py-3 rounded-2xl text-sm font-semibold ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>أنثى</button>
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ ومتابعة
          </button>
        </form>
      </div>
    </div>
  );
}
