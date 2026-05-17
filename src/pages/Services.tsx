import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Heart, Loader2, LocateFixed, MapPin, Plus, Search, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  FAZAA_CATEGORIES,
  JORDAN_CITIES,
  distanceKm,
  fetchFeed,
  formatTimeAgo,
  offerHelp,
  urgencyVariant,
  type FazaaRequest,
} from "@/lib/fazaa";

const FILTERS = ["الكل", ...FAZAA_CATEGORIES] as const;
const RADII = [0, 5, 10, 25, 50] as const;

function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export default function Services() {
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [items, setItems] = useState<FazaaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("الكل");
  const [city, setCity] = useState<string>("");
  const [radius, setRadius] = useState<number>(0);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchFeed()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const locate = () => {
    if (!navigator.geolocation) return toast.error("الموقع غير مدعوم");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("تم تحديد موقعك");
      },
      () => {
        setLocating(false);
        toast.error("تعذر تحديد الموقع");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (i.status !== "active") return false;
      const matchesFilter = filter === "الكل" || i.category === filter;
      const matchesCity = !city || i.city === city;
      const text = `${i.requester_name} ${i.need} ${i.location ?? ""} ${i.category} ${i.city ?? ""}`;
      const matchesQuery = query.trim() ? text.includes(query.trim()) : true;
      let matchesRadius = true;
      if (radius > 0) {
        if (!myLoc || typeof i.latitude !== "number" || typeof i.longitude !== "number") {
          matchesRadius = false;
        } else {
          matchesRadius = distanceKm(myLoc, { lat: i.latitude, lng: i.longitude }) <= radius;
        }
      }
      return matchesFilter && matchesCity && matchesQuery && matchesRadius;
    });
  }, [items, filter, city, query, radius, myLoc]);

  const handleOffer = async (req: FazaaRequest) => {
    if (!user || !profile) return;
    if (req.user_id === user.id) {
      toast.info("هذا طلبك");
      return;
    }
    if (req.female_only && profile.gender !== "female") {
      toast.error("هذه الفزعة للبنات فقط");
      return;
    }
    try {
      await offerHelp(req.id, user.id, profile.name, "أنا جاهز للمساعدة");
      toast.success("تم إرسال استجابتك. سيتواصل معك صاحب الفزعة عند القبول");
    } catch (e: any) {
      if (e?.code === "23505") toast.info("سبق وأرسلت استجابة لهذا الطلب");
      else toast.error(e?.message ?? "تعذر الإرسال");
    }
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="كل الفزعات" subtitle="فلتر، ابحث، استجب بسرعة" back={false} />

      <div className="p-4 space-y-4">
        <div className="rounded-3xl bg-card shadow-card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في الفزعات"
              className="w-full rounded-2xl bg-secondary pr-10 pl-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">كل المدن</option>
              {JORDAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={0}>أي مسافة</option>
              {RADII.filter((r) => r > 0).map((r) => (
                <option key={r} value={r}>ضمن {r} كم من موقعي</option>
              ))}
            </select>
          </div>

          {radius > 0 && (
            <button
              type="button"
              onClick={locate}
              className="w-full rounded-2xl bg-secondary py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <LocateFixed className="w-4 h-4" />
              {locating ? "جاري تحديد موقعك..." : myLoc ? "تحديث موقعي" : "حدد موقعي للفلترة"}
            </button>
          )}

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map((o) => {
              const active = filter === o;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => setFilter(o)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => nav("/fazaa")}
          className="w-full rounded-3xl gradient-hero px-4 py-4 text-primary-foreground shadow-elevated flex items-center justify-between gap-3"
        >
          <div className="text-right">
            <div className="font-display text-lg font-extrabold">أضف طلب فزعة</div>
            <div className="text-sm opacity-90 mt-1">رقمك يبقى مخفياً</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
        </button>

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        <div className="space-y-3">
          {visible.map((item) => (
            <Card
              key={item.id}
              item={item}
              isMine={item.user_id === user?.id}
              onOffer={() => handleOffer(item)}
              myLoc={myLoc}
            />
          ))}
          {!loading && visible.length === 0 && (
            <div className="rounded-3xl bg-card shadow-card p-6 text-center text-sm text-muted-foreground">
              لا توجد نتائج بالفلتر الحالي.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  item,
  isMine,
  onOffer,
  myLoc,
}: {
  item: FazaaRequest;
  isMine: boolean;
  onOffer: () => void;
  myLoc: { lat: number; lng: number } | null;
}) {
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  const dist =
    myLoc && typeof item.latitude === "number" && typeof item.longitude === "number"
      ? distanceKm(myLoc, { lat: item.latitude, lng: item.longitude })
      : null;
  return (
    <div className="rounded-3xl bg-card shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
            {item.requester_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[11px] font-semibold">
                <ShieldCheck className="w-3 h-3" /> موثّق
              </span>
            )}
            {item.female_only && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 text-pink-600 px-2 py-1 text-[11px] font-semibold">
                <Heart className="w-3 h-3" /> للبنات فقط
              </span>
            )}
            {item.city && (
              <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.city}</span>
            )}
            {isMine && <span className="rounded-full bg-accent/12 text-accent px-2 py-1 text-[11px]">طلبي</span>}
          </div>
          <p className="mt-2 text-sm leading-6">{item.need}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {item.location}
              </span>
            )}
            {dist !== null && (
              <span className="flex items-center gap-1">
                <LocateFixed className="w-3.5 h-3.5" /> {dist.toFixed(1)} كم
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatTimeAgo(item.created_at)}</span>
      </div>

      {!isMine && (
        <button
          type="button"
          onClick={onOffer}
          className="mt-3 w-full rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          أنا جاهز للمساعدة
        </button>
      )}
      {isMine && (
        <div className="mt-3 rounded-2xl bg-secondary py-3 text-xs text-muted-foreground text-center">
          افتح صفحة "اطلب فزعة" لرؤية المستجيبين وقبولهم
        </div>
      )}
    </div>
  );
}
