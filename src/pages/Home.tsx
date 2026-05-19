import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircleMore, Plus, Siren, ArrowLeft, MapPin, Loader2, UserCheck, Activity, Trophy, Users as UsersIcon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchFeed,
  formatTimeAgo,
  urgencyVariant,
  fetchJordanStats,
  fetchMyActiveWatch,
  startAreaWatch,
  stopAreaWatch,
  JORDAN_CITIES,
  type FazaaRequest,
  type JordanStats,
  type AreaWatcher,
} from "@/lib/fazaa";

function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export default function Home() {
  const nav = useNavigate();
  const { profile, user } = useAuth();
  const [items, setItems] = useState<FazaaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<JordanStats | null>(null);
  const [myWatch, setMyWatch] = useState<AreaWatcher | null>(null);
  const [watchCity, setWatchCity] = useState<string>(profile?.city ?? "عمّان");
  const [watchBusy, setWatchBusy] = useState(false);

  const loadAll = async () => {
    const [feed, s] = await Promise.all([fetchFeed(), fetchJordanStats()]);
    setItems(feed);
    setStats(s);
    if (user) setMyWatch(await fetchMyActiveWatch(user.id));
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (profile?.city && !myWatch) setWatchCity(profile.city);
  }, [profile?.city, myWatch]);

  const toggleWatch = async () => {
    if (!user || !profile) return;
    setWatchBusy(true);
    try {
      if (myWatch) {
        await stopAreaWatch(user.id);
        setMyWatch(null);
        toast.success("تم إيقاف وضع التواجد");
      } else {
        const w = await startAreaWatch(user.id, profile.name, watchCity);
        setMyWatch(w);
        toast.success(`أنت الآن متواجد في ${watchCity} لمدة 4 ساعات`);
      }
      const s = await fetchJordanStats();
      setStats(s);
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر التحديث");
    } finally {
      setWatchBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      <header className="safe-top border-b border-border bg-background sticky top-0 z-20">
        <div className="px-4 pt-4 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold">فزعة</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {profile ? `أهلاً ${profile.name}` : "مساعدة فورية بين الناس"}
              </p>
              {profile && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/12 text-accent px-2.5 py-1 text-[11px] font-bold">
                  <Trophy className="w-3 h-3" />
                  {profile.points ?? 0} نقطة فزعة
                </div>
              )}
            </div>
            <button
              onClick={() => nav("/chat")}
              className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center"
              aria-label="المساعد"
            >
              <MessageCircleMore className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 pt-4 space-y-3">
        <button
          type="button"
          onClick={() => nav("/fazaa")}
          className="w-full rounded-3xl gradient-hero px-4 py-4 text-primary-foreground text-right shadow-elevated active:scale-[0.99] transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-extrabold">أحتاج فزعة الآن</div>
              <div className="text-sm opacity-90 mt-1">انشر طلبك، رقمك يبقى مخفياً</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6" />
            </div>
          </div>
        </button>

        {/* Area Watch */}
        <div className="rounded-3xl bg-card shadow-card p-4">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${myWatch ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {myWatch ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold">أنا بالمنطقة</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {myWatch
                  ? `أنت متواجد في ${myWatch.city} — مستعد لأي فزعة قريبة`
                  : "فعّل التواجد لتظهر للناس أنك جاهز للفزعة في منطقتك"}
              </p>
            </div>
          </div>
          {!myWatch && (
            <select
              value={watchCity}
              onChange={(e) => setWatchCity(e.target.value)}
              className="mt-3 w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {JORDAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={toggleWatch}
            disabled={watchBusy || !profile}
            className={`mt-3 w-full rounded-2xl py-3 text-sm font-semibold disabled:opacity-50 ${myWatch ? "bg-destructive/10 text-destructive" : "bg-primary text-primary-foreground"}`}
          >
            {watchBusy ? "..." : myWatch ? "إيقاف التواجد" : "أنا متواجد الآن (4 ساعات)"}
          </button>
        </div>

        {/* Jordan Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<Activity className="w-4 h-4" />} label="فزعات نشطة" value={stats?.activeNow ?? 0} tone="primary" />
          <StatTile icon={<Trophy className="w-4 h-4" />} label="أُنجزت هذا الأسبوع" value={stats?.completedWeek ?? 0} tone="accent" />
          <StatTile icon={<UsersIcon className="w-4 h-4" />} label="متواجدون الآن" value={stats?.watchersNow ?? 0} tone="secondary" />
        </div>
        {stats?.topCity && (
          <div className="rounded-2xl bg-card shadow-card px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">أكثر مدينة تحتاج فزعة الآن</span>
            <span className="font-display font-extrabold text-sm">{stats.topCity.city} · {stats.topCity.count}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => nav("/leaderboard")}
          className="w-full rounded-2xl bg-accent/10 text-accent py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          شوف لوحة شرف الأسبوع و"أبو الفزعات"
        </button>

        <div className="rounded-3xl bg-card shadow-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">آخر الفزعات</h2>
              <p className="text-xs text-muted-foreground mt-1">اضغط "أنا جاهز" لتعرض استجابتك</p>
            </div>
            <button onClick={() => nav("/fazaa")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          <div className="space-y-3">
            {items.slice(0, 4).map((item) => (
              <PreviewCard key={item.id} item={item} onOpen={() => nav("/fazaa")} />
            ))}
            {!loading && items.length === 0 && (
              <div className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground text-center">
                لا توجد فزعات حالياً. كن أول من ينشر.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent/12 text-accent flex items-center justify-center shrink-0">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">المساعد الذكي</h2>
              <p className="text-xs text-muted-foreground mt-1">يساعدك بصياغة الطلب وتحديد أسرع تصرف</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => nav("/chat")}
            className="mt-4 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold"
          >
            افتح المساعد
          </button>
        </div>
      </section>
    </div>
  );
}

function PreviewCard({ item, onOpen }: { item: FazaaRequest; onOpen: () => void }) {
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  return (
    <button type="button" onClick={onOpen} className="w-full text-right rounded-2xl border border-border bg-background px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-bold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
          </div>
          <p className="text-sm leading-6 mt-2 line-clamp-2">{item.need}</p>
          {item.location && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.location}</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatTimeAgo(item.created_at)}</span>
      </div>
      <div className="mt-3 rounded-xl bg-secondary py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
        <UserCheck className="w-4 h-4" />
        افتح للاستجابة
      </div>
    </button>
  );
}

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "accent" | "secondary" }) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "accent"
      ? "bg-accent/12 text-accent"
      : "bg-secondary text-foreground";
  return (
    <div className="rounded-2xl bg-card shadow-card p-3 text-center">
      <div className={`mx-auto w-9 h-9 rounded-xl flex items-center justify-center ${toneClass}`}>{icon}</div>
      <div className="mt-2 font-display text-xl font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
