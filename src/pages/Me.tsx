import PageHeader from "@/components/PageHeader";
import { LogOut, ShieldCheck, User as UserIcon, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Me() {
  const { profile, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="حسابي" back={false} />
      <div className="p-4 space-y-3">
        <section className="rounded-3xl bg-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-extrabold">{profile?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1" dir="ltr">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center justify-between">
              <span className="text-muted-foreground">الهاتف</span>
              <span dir="ltr" className="font-semibold">{profile?.phone ?? "—"}</span>
            </div>
            <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center justify-between">
              <span className="text-muted-foreground">الجنس</span>
              <span className="font-semibold">{profile?.gender === "female" ? "أنثى" : "ذكر"}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-card shadow-card p-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/12 text-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-extrabold">خصوصيتك محمية</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-6">
              رقم هاتفك مخفي تماماً. فقط صاحب الفزعة يرى رقم من قبل استجابته، وصاحب الفزعة هو من يبادر بالتواصل عبر واتساب أو الاتصال.
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
