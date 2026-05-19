import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Award, Bell, ClipboardList, Crown, LogOut, Phone, ShieldCheck, Trophy, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JORDAN_CITIES, VERIFIED_HELPER_THRESHOLD, fetchUserCompletedCount, markSelfVerified } from "@/lib/fazaa";
import { formatJordanPhoneDisplay, isValidJordanPhone, normalizeJordanPhone } from "@/lib/phone";
import { requestNotificationPermission } from "@/hooks/useRealtimeFazaa";

export default function Me() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(profile?.city ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [completed, setCompleted] = useState<number>(0);

  useEffect(() => {
    if (user) fetchUserCompletedCount(user.id).then(setCompleted);
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
  };

  const handleVerify = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await markSelfVerified();
      if (ok) {
        toast.success("تم تفعيل شارة موثّق");
        await refreshProfile();
      } else {
        toast.error("لم يتم تأكيد بريدك بعد. تحقق من بريدك واضغط الرابط");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر التحقق");
    } finally {
      setBusy(false);
    }
  };

  const handleEnableNotifs = async () => {
    const p = await requestNotificationPermission();
    if (p === "granted") toast.success("تم تفعيل الإشعارات");
    else if (p === "denied") toast.error("الإشعارات مرفوضة من المتصفح");
  };

  const saveProfile = async () => {
    if (!user) return;
    const newPhone = phone.trim();
    if (newPhone && !isValidJordanPhone(newPhone)) {
      toast.error("الرقم يجب أن يكون أردني صحيح (مثال: 0791234567)");
      return;
    }
    const normalized = normalizeJordanPhone(newPhone);
    const phoneChanged = normalized !== (profile?.phone ?? "");
    setBusy(true);
    try {
      const updates: { city: string | null; phone: string; phone_verified?: boolean } = { city: city || null, phone: normalized };
      if (phoneChanged) updates.phone_verified = false;
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      toast.success(phoneChanged ? "تم الحفظ — أعد تأكيد رقمك الجديد" : "تم الحفظ");
      if (phoneChanged) nav("/complete-profile");
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  };

  const isVerifiedHelper = completed >= VERIFIED_HELPER_THRESHOLD;

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="حسابي" back={false} />
      <div className="p-4 space-y-3">
        <section className="rounded-3xl bg-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-display font-extrabold">{profile?.name ?? "—"}</div>
                {profile?.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[11px] font-semibold">
                    <ShieldCheck className="w-3 h-3" /> موثّق
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1" dir="ltr">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl gradient-hero p-4 text-primary-foreground flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">نقاط الفزعة</div>
              <div className="font-display text-3xl font-extrabold mt-1">{profile?.points ?? 0}</div>
              <div className="text-[11px] opacity-90 mt-1">+10 نقاط لكل فزعة أنجزتها بقبول صاحبها</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
          </div>

          {!editing ? (
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center justify-between">
                <span className="text-muted-foreground">الهاتف</span>
                <span dir="ltr" className="font-semibold">{profile?.phone ?? "—"}</span>
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center justify-between">
                <span className="text-muted-foreground">المدينة</span>
                <span className="font-semibold">{profile?.city ?? "—"}</span>
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center justify-between">
                <span className="text-muted-foreground">الجنس</span>
                <span className="font-semibold">{profile?.gender === "female" ? "أنثى" : "ذكر"}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-2xl bg-primary/10 text-primary py-2.5 text-sm font-semibold"
              >
                تعديل البيانات
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="رقم الهاتف"
                dir="ltr"
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر المدينة</option>
                {JORDAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveProfile}
                  className="rounded-2xl gradient-hero py-3 text-primary-foreground font-semibold disabled:opacity-50"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-2xl bg-secondary py-3 font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </section>

        {!profile?.verified && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={busy}
            className="w-full rounded-2xl bg-primary/10 text-primary py-3.5 font-semibold flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            تفعيل شارة "موثّق" (بعد تأكيد البريد)
          </button>
        )}

        <button
          type="button"
          onClick={handleEnableNotifs}
          className="w-full rounded-2xl bg-secondary py-3.5 font-semibold flex items-center justify-center gap-2"
        >
          <Bell className="w-4 h-4" />
          تفعيل الإشعارات الفورية للفزعات الجديدة
        </button>

        <button
          type="button"
          onClick={() => nav("/history")}
          className="w-full rounded-2xl bg-secondary py-3.5 font-semibold flex items-center justify-center gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          سجل الفزعات السابقة
        </button>

        <section className="rounded-3xl bg-card shadow-card p-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/12 text-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-extrabold">خصوصيتك محمية</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-6">
              رقم هاتفك مخفي تماماً. فقط صاحب الفزعة يرى رقم من قبل استجابته، وصاحب الفزعة هو من يبادر بالتواصل. الفزعات المعلّمة "للبنات فقط" لا يستطيع الذكور الاستجابة لها.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-card shadow-card p-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-extrabold">كيف تعمل الاستجابة</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-6">
              عندما ترى فزعة، اضغط "أنا جاهز للمساعدة". لن يظهر رقمك للعموم. صاحب الفزعة يرى استجابتك، يقبلها أو يرفضها، ثم يتواصل معك مباشرة.
            </p>
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl bg-destructive/10 text-destructive py-3.5 font-semibold flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
