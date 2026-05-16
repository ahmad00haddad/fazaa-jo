import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Loader2, MapPin, Plus, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  FAZAA_CATEGORIES,
  fetchFeed,
  formatTimeAgo,
  offerHelp,
  urgencyVariant,
  type FazaaRequest,
} from "@/lib/fazaa";

const FILTERS = ["الكل", ...FAZAA_CATEGORIES] as const;

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

  useEffect(() => {
    fetchFeed()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    return items.filter((i) => {
      const matchesFilter = filter === "الكل" || i.category === filter;
      const text = `${i.requester_name} ${i.need} ${i.location ?? ""} ${i.category}`;
      const matchesQuery = query.trim() ? text.includes(query.trim()) : true;
      return matchesFilter && matchesQuery;
    });
  }, [items, filter, query]);

  const handleOffer = async (req: FazaaRequest) => {
    if (!user || !profile) return;
    if (req.user_id === user.id) {
      toast.info("هذا طلبك");
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
      <PageHeader title="كل الفزعات" subtitle="ابحث وفلتر حسب نوع الحاجة" back={false} />

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
            <Card key={item.id} item={item} isMine={item.user_id === user?.id} onOffer={() => handleOffer(item)} />
          ))}
          {!loading && visible.length === 0 && (
            <div className="rounded-3xl bg-card shadow-card p-6 text-center text-sm text-muted-foreground">
              لا توجد نتائج.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ item, isMine, onOffer }: { item: FazaaRequest; isMine: boolean; onOffer: () => void }) {
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  return (
    <div className="rounded-3xl bg-card shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
            {isMine && <span className="rounded-full bg-accent/12 text-accent px-2 py-1 text-[11px]">طلبي</span>}
          </div>
          <p className="mt-2 text-sm leading-6">{item.need}</p>
          {item.location && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.location}</span>
            </div>
          )}
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
