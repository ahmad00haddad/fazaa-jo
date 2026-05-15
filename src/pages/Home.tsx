import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircleMore, Search, Siren, Plus, MapPin, Phone, ArrowLeft } from "lucide-react";
import {
  FAZAA_CATEGORIES,
  SEED_REQUESTS,
  buildMapsUrl,
  buildWhatsAppUrl,
  formatTimeAgo,
  urgencyVariant,
  type FazaaRequest,
} from "@/lib/fazaa";

const FILTERS = ["الكل", ...FAZAA_CATEGORIES] as const;

function badgeClass(variant: "primary" | "accent" | "secondary") {
  if (variant === "primary") return "bg-primary/12 text-primary";
  if (variant === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export default function Home() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("الكل");

  const items = useMemo(() => {
    return SEED_REQUESTS.filter((item) => {
      const matchesFilter = activeFilter === "الكل" || item.category === activeFilter;
      const text = `${item.name} ${item.need} ${item.location ?? ""} ${item.category}`;
      const matchesQuery = query.trim() ? text.includes(query.trim()) : true;
      return matchesFilter && matchesQuery;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [activeFilter, query]);

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      <header className="safe-top border-b border-border bg-background sticky top-0 z-20">
        <div className="px-4 pt-4 pb-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold">فزعة</h1>
              <p className="text-sm text-muted-foreground mt-1">اطلب مساعدة فورية أو استجب مباشرة لمن حولك</p>
            </div>
            <button
              onClick={() => nav("/chat")}
              className="w-11 h-11 rounded-2xl bg-secondary text-foreground flex items-center justify-center active:scale-95 transition"
              aria-label="المساعد الذكي"
            >
              <MessageCircleMore className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <QuickStat label="طلبات نشطة" value={String(SEED_REQUESTS.length)} />
            <QuickStat label="الأكثر إلحاحاً" value="حرجة" />
            <QuickStat label="منطقتك" value="الأردن" />
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن طلب مساعدة أو منطقة"
              className="w-full rounded-2xl bg-secondary pr-10 pl-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
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
              <div className="text-sm opacity-90 mt-1">أنشئ طلباً جديداً وحدد الموقع وطريقة التواصل بسرعة</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6" />
            </div>
          </div>
        </button>

        <div className="rounded-3xl bg-card shadow-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">أقرب طلبات تحتاج استجابة</h2>
              <p className="text-xs text-muted-foreground mt-1">اتصال، واتساب، أو فتح الموقع مباشرة</p>
            </div>
            <button
              onClick={() => nav("/fazaa")}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
              aria-label="عرض الكل"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {items.slice(0, 4).map((item) => (
              <RequestPreviewCard key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <div className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground text-center">
                لا توجد نتائج مطابقة حالياً.
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
              <h2 className="font-display text-base font-bold">المساعد الذكي لفزعة</h2>
              <p className="text-xs text-muted-foreground mt-1">يساعدك بصياغة الطلب، فرزه، وتحديد أفضل تصرف سريع</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => nav("/chat")}
            className="mt-4 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold active:scale-[0.99] transition"
          >
            افتح المساعد الآن
          </button>
        </div>
      </section>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card shadow-card px-3 py-3 text-center">
      <div className="font-display text-base font-extrabold">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function RequestPreviewCard({ item }: { item: FazaaRequest }) {
  const mapsUrl = buildMapsUrl(item);
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));

  return (
    <div className="rounded-2xl border border-border bg-background px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-bold">{item.name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
          </div>
          <p className="text-sm leading-6 mt-2">{item.need}</p>
          {item.location && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.location}</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatTimeAgo(item.createdAt)}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href={`tel:${item.phone}`} className="rounded-xl bg-secondary py-2 text-center text-xs font-semibold">
          <Phone className="w-4 h-4 mx-auto mb-1" />
          اتصال
        </a>
        <a href={buildWhatsAppUrl(item.phone, `مرحباً ${item.name}، شاهدت طلب الفزعة الخاص بك وأستطيع المساعدة.`)} target="_blank" rel="noreferrer" className="rounded-xl bg-secondary py-2 text-center text-xs font-semibold">
          <MessageCircleMore className="w-4 h-4 mx-auto mb-1" />
          واتساب
        </a>
        <a
          href={mapsUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className={`rounded-xl py-2 text-center text-xs font-semibold ${mapsUrl ? "bg-secondary" : "bg-muted text-muted-foreground pointer-events-none"}`}
        >
          <MapPin className="w-4 h-4 mx-auto mb-1" />
          موقع
        </a>
      </div>
    </div>
  );
}
