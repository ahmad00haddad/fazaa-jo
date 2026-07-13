import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircleMore, Plus, Siren, ArrowLeft, MapPin, UserCheck, Activity, Trophy, Users as UsersIcon, Eye, EyeOff, Map as MapIcon, List, Share2, Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFeed,
  filterActiveFeed,
  formatTimeAgo,
  urgencyVariant,
  fetchJordanStats,
  fetchMyActiveWatch,
  startAreaWatch,
  stopAreaWatch,
  JORDAN_CITIES,
  FAZAA_CATEGORIES,
  type FazaaRequest,
} from "@/lib/fazaa";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";
import FazaaMap from "@/components/fazaa/FazaaMap";
import InstallPWAButton from "@/components/InstallPWAButton";
import ThemeToggle from "@/components/ThemeToggle";

function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export default function Home() {
  const nav = useNavigate();
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [watchCity, setWatchCity] = useState<string>(profile?.city ?? "عمّان");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");

  const { data: feed = [], isLoading: loadingFeed } = useQuery({
    queryKey: ['fazaa_feed'],
    queryFn: fetchFeed,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['jordan_stats'],
    queryFn: fetchJordanStats,
  });

  const { data: myWatch, isLoading: loadingWatch } = useQuery({
    queryKey: ['my_watch', user?.id],
    queryFn: () => user ? fetchMyActiveWatch(user.id) : null,
    enabled: !!user?.id,
  });

  const allActiveItems = filterActiveFeed(feed, { viewerGender: profile?.gender, viewerId: user?.id });
  const items = selectedCategory === "الكل" ? allActiveItems : allActiveItems.filter(i => i.category === selectedCategory);
  const loading = loadingFeed || loadingStats || loadingWatch;

  useRealtimeFazaa(() => {
    queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
  });

  useEffect(() => {
    if (profile?.city && !myWatch) setWatchCity(profile.city);
  }, [profile?.city, myWatch]);

  const toggleWatchMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Not authenticated");
      if (myWatch) {
        await stopAreaWatch(user.id);
        return "تم إيقاف وضع التواجد";
      } else {
        await startAreaWatch(user.id, profile.name, watchCity);
        return `أنت الآن متواجد في ${watchCity} لمدة 4 ساعات`;
      }
    },
    onSuccess: (msg) => {
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['my_watch', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['jordan_stats'] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "تعذر التحديث");
    }
  });

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      <header className="safe-top border-b border-border/40 glass-strong sticky top-0 z-20">
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
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <InstallPWAButton />
              <button
                type="button"
                onClick={() => nav("/notifications")}
                className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center relative"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 pt-4 space-y-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => nav("/fazaa")}
          className="w-full btn-brand rounded-full px-6 py-5 text-primary-foreground text-right"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-extrabold">أحتاج فزعة الآن</div>
              <div className="text-sm opacity-90 mt-0.5">انشر طلبك، رقمك يبقى مخفياً</div>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
          </div>
        </motion.button>

        {/* Area Watch */}
        <div className="rounded-2xl glass-ultra shadow-card p-4">
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
            onClick={() => toggleWatchMutation.mutate()}
            disabled={toggleWatchMutation.isPending || !profile}
            className={`mt-3 w-full rounded-full py-3.5 text-sm font-bold disabled:opacity-50 transition-all ${
              myWatch
                ? "bg-destructive/15 text-destructive"
                : "btn-brand"
            }`}
          >
            {toggleWatchMutation.isPending ? "..." : myWatch ? "إيقاف التواجد" : "أنا متواجد الآن (4 ساعات)"}
          </button>
        </div>

        {/* Jordan Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<Activity className="w-4 h-4" />} label="فزعات نشطة" value={stats?.activeNow ?? 0} tone="primary" />
          <StatTile icon={<Trophy className="w-4 h-4" />} label="أُنجزت هذا الأسبوع" value={stats?.completedWeek ?? 0} tone="accent" />
          <StatTile icon={<UsersIcon className="w-4 h-4" />} label="متواجدون الآن" value={stats?.watchersNow ?? 0} tone="secondary" />
        </div>
        {stats?.topCity && (
          <div className="rounded-2xl glass-ultra shadow-card px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">أكثر مدينة تحتاج فزعة الآن</span>
            <span className="font-display font-extrabold text-sm">{stats.topCity.city} · {stats.topCity.count}</span>
          </div>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => nav("/leaderboard")}
          className="w-full rounded-2xl bg-secondary text-foreground/80 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-card"
        >
          <Trophy className="w-4 h-4 text-accent" />
          شوف لوحة شرف الأسبوع و"أبو الفزعات"
        </motion.button>

        <div className="rounded-3xl glass-ultra shadow-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">آخر الفزعات</h2>
              <p className="text-xs text-muted-foreground mt-1">اضغط "أنا جاهز" لتعرض استجابتك</p>
            </div>
            <div className="flex gap-1 bg-secondary rounded-2xl p-1">
              <button 
                onClick={() => setViewMode("list")} 
                className={`p-1.5 rounded-xl transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode("map")} 
                className={`p-1.5 rounded-xl transition-colors ${viewMode === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>
            <button onClick={() => nav("/fazaa")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mr-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory("الكل")}
              className={`whitespace-nowrap px-4 py-2 rounded-2xl text-[11px] font-bold transition-all ${
                selectedCategory === "الكل" ? "bg-primary text-primary-foreground shadow-glow scale-105" : "bg-secondary text-foreground/80 hover:bg-secondary/80"
              }`}
            >
              الكل
            </button>
            {FAZAA_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-[11px] font-bold transition-all ${
                  selectedCategory === cat ? "bg-primary text-primary-foreground shadow-glow scale-105" : "bg-secondary text-foreground/80 hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-background px-3 py-3 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="h-4 w-20 rounded-full bg-muted" />
                        <div className="h-4 w-14 rounded-full bg-muted" />
                      </div>
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-3/4 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-10 rounded bg-muted shrink-0" />
                  </div>
                  <div className="mt-3 h-9 w-full rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!loading && viewMode === "map" ? (
            <FazaaMap items={items} onOpen={(item) => nav("/fazaa")} />
          ) : (
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
          )}
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

  const handleOffer = () => {
    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate([8, 4, 8]);
    onOpen();
  };

  return (
    <motion.button
      type="button"
      onClick={handleOffer}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-full text-right rounded-2xl border border-border bg-background px-3 py-3 shadow-soft active:shadow-none transition-shadow"
    >
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
      <div className="mt-3 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            const text = `فزعة عاجلة (${item.category}): ${item.need}\nالمدينة: ${item.city || 'الأردن'}\nرابط التطبيق: ${window.location.origin}`;
            if (navigator.share) navigator.share({ title: "فزعة عاجلة", text });
            else { navigator.clipboard.writeText(text); toast.success("تم نسخ نص الفزعة"); }
          }}
          className="rounded-xl bg-secondary py-2 px-3 text-muted-foreground flex items-center justify-center transition-colors hover:text-foreground min-h-[44px]"
        >
          <Share2 className="w-4 h-4" />
        </motion.button>
        <div className="flex-1 rounded-xl bg-primary/10 text-primary py-2 text-xs font-bold text-center flex items-center justify-center gap-2 min-h-[44px]">
          <UserCheck className="w-4 h-4" />
          افتح للاستجابة
        </div>
      </div>
    </motion.button>
  );
}

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "accent" | "secondary" }) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/15 text-primary"
      : tone === "accent"
      ? "bg-accent/15 text-accent"
      : "bg-secondary text-foreground";
  return (
    <div className="rounded-2xl bg-card shadow-card p-3 text-center">
      <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center ${toneClass}`}>{icon}</div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
