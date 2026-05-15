import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Search, MessageCircleMore, MapPin, Phone, Plus, Filter } from "lucide-react";
import {
  FAZAA_CATEGORIES,
  buildMapsUrl,
  buildWhatsAppUrl,
  formatTimeAgo,
  loadFazaaFeed,
  urgencyVariant,
  type FazaaRequest,
} from "@/lib/fazaa";

const FILTERS = ["الكل", ...FAZAA_CATEGORIES] as const;

function badgeClass(variant: "primary" | "accent" | "secondary") {
  if (variant === "primary") return "bg-primary/12 text-primary";
  if (variant === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export default function Services() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("الكل");
  const [mineOnly, setMineOnly] = useState(false);

  const items = useMemo(() => {
    return loadFazaaFeed().filter((item) => {
      const matchesMine = !mineOnly || item.mine;
      const matchesFilter = filter === "الكل" || item.category === filter;
      const haystack = `${item.name} ${item.need} ${item.location ?? ""} ${item.category}`;
      const matchesQuery = query.trim() ? haystack.includes(query.trim()) : true;
      return matchesMine && matchesFilter && matchesQuery;
    });
  }, [filter, mineOnly, query]);

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="طلبات الفزعة" subtitle="تابع جميع الطلبات النشطة" back={false} />

      <div className="p-4 space-y-4">
        <div className="rounded-3xl bg-card shadow-card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم، منطقة، أو نوع الحاجة"
              className="w-full rounded-2xl bg-secondary pr-10 pl-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map((option) => {
              const active = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMineOnly((value) => !value)}
            className={`w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
              mineOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Filter className="w-4 h-4" />
            {mineOnly ? "إظهار كل الطلبات" : "إظهار طلباتي فقط"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => nav("/fazaa")}
          className="w-full rounded-3xl gradient-hero px-4 py-4 text-primary-foreground shadow-elevated flex items-center justify-between gap-3 active:scale-[0.99] transition"
        >
          <div className="text-right">
            <div className="font-display text-lg font-extrabold">أضف طلب فزعة جديد</div>
            <div className="text-sm opacity-90 mt-1">حدد الحالة والموقع وطريقة التواصل</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
        </button>

        <div className="space-y-3">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
          {items.length === 0 && (
            <div className="rounded-3xl bg-card shadow-card p-6 text-center text-sm text-muted-foreground">
              لا توجد طلبات مطابقة حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: FazaaRequest }) {
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  const mapsUrl = buildMapsUrl(item);

  return (
    <div className="rounded-3xl bg-card shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
            {item.mine && <span className="rounded-full bg-accent/12 px-2 py-1 text-[11px] text-accent">طلبي</span>}
          </div>
          <p className="mt-2 text-sm leading-6">{item.need}</p>
          {item.location && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.location}</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatTimeAgo(item.createdAt)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <a href={`tel:${item.phone}`} className="rounded-2xl bg-secondary py-3 text-center text-xs font-semibold">
          <Phone className="w-4 h-4 mx-auto mb-1" />
          اتصال
        </a>
        <a
          href={buildWhatsAppUrl(item.phone, `مرحباً ${item.name}، أنا جاهز للمساعدة بخصوص طلب الفزعة.`)}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-secondary py-3 text-center text-xs font-semibold"
        >
          <MessageCircleMore className="w-4 h-4 mx-auto mb-1" />
          واتساب
        </a>
        <a
          href={mapsUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className={`rounded-2xl py-3 text-center text-xs font-semibold ${mapsUrl ? "bg-secondary" : "bg-muted text-muted-foreground pointer-events-none"}`}
        >
          <MapPin className="w-4 h-4 mx-auto mb-1" />
          موقع
        </a>
      </div>
    </div>
  );
}
