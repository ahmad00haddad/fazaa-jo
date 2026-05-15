import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { MapPin, MessageCircleMore, Phone, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  FAZAA_CATEGORIES,
  FAZAA_URGENCY_OPTIONS,
  buildMapsUrl,
  buildWhatsAppUrl,
  createFazaaRequest,
  deleteMyFazaaRequest,
  formatTimeAgo,
  loadFazaaFeed,
  urgencyVariant,
  type FazaaRequest,
  type NewFazaaRequest,
} from "@/lib/fazaa";

function badgeClass(variant: "primary" | "accent" | "secondary") {
  if (variant === "primary") return "bg-primary/12 text-primary";
  if (variant === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

const initialForm: NewFazaaRequest = {
  name: "",
  phone: "",
  need: "",
  category: "أخرى",
  urgency: "عاجلة اليوم",
  location: "",
};

export default function Fazaa() {
  const [items, setItems] = useState<FazaaRequest[]>(() => loadFazaaFeed());
  const [showComposer, setShowComposer] = useState(false);

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt), [items]);

  const handleAdd = (payload: NewFazaaRequest) => {
    const next = createFazaaRequest(payload);
    setItems((current) => [next, ...current]);
    setShowComposer(false);
    toast.success("تم نشر طلب الفزعة بنجاح");
  };

  const handleDelete = (id: string) => {
    deleteMyFazaaRequest(id);
    setItems(loadFazaaFeed());
    toast.success("تم حذف الطلب");
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <PageHeader title="فزعة المجتمع" subtitle="طلبات مباشرة قابلة للتنفيذ" back={false} />

      <div className="p-4 space-y-4">
        <section className="rounded-3xl gradient-hero p-4 text-primary-foreground shadow-elevated">
          <h2 className="font-display text-xl font-extrabold">إذا كنت بحاجة إلى مساعدة الآن</h2>
          <p className="text-sm opacity-90 mt-2 leading-6">اكتب حاجتك بوضوح، أضف رقمك وموقعك، وسيظهر الطلب فوراً ضمن قائمة الفزعات.</p>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="mt-4 w-full rounded-2xl bg-white/15 py-3 font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <Plus className="w-5 h-5" />
            اطلب فزعة الآن
          </button>
        </section>

        <section className="space-y-3">
          {sortedItems.map((item) => (
            <FazaaCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </section>
      </div>

      {showComposer && <RequestComposer onClose={() => setShowComposer(false)} onSubmit={handleAdd} />}
    </div>
  );
}

function FazaaCard({ item, onDelete }: { item: FazaaRequest; onDelete: (id: string) => void }) {
  const mapsUrl = buildMapsUrl(item);
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));

  return (
    <article className="rounded-3xl bg-card shadow-card p-4">
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

      {item.mine && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="mt-3 w-full rounded-2xl bg-destructive/10 py-3 text-sm font-semibold text-destructive flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          حذف الطلب
        </button>
      )}
    </article>
  );
}

function RequestComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (payload: NewFazaaRequest) => void }) {
  const [form, setForm] = useState<NewFazaaRequest>(initialForm);
  const [locating, setLocating] = useState(false);

  const update = <K extends keyof NewFazaaRequest>(key: K, value: NewFazaaRequest[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canSubmit = form.name.trim() && form.phone.trim() && form.need.trim();

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("الموقع غير مدعوم على هذا الجهاز");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", Number(position.coords.latitude.toFixed(5)));
        update("longitude", Number(position.coords.longitude.toFixed(5)));
        update("location", `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
        setLocating(false);
        toast.success("تم تحديد موقعك");
      },
      () => {
        setLocating(false);
        toast.error("تعذر تحديد الموقع");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("الاسم، الهاتف، ووصف الحالة مطلوبة");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      need: form.need.trim(),
      location: form.location?.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-t-[28px] bg-background p-5 safe-bottom" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-extrabold">طلب فزعة جديد</h2>
            <p className="text-xs text-muted-foreground mt-1">كلما كان الوصف أوضح كانت الاستجابة أسرع</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            type="tel"
            placeholder="رقم الهاتف أو واتساب"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as NewFazaaRequest["category"])}
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {FAZAA_CATEGORIES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={form.urgency}
              onChange={(e) => update("urgency", e.target.value as NewFazaaRequest["urgency"])}
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {FAZAA_URGENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <textarea
            value={form.need}
            onChange={(e) => update("need", e.target.value)}
            placeholder="اكتب حاجتك بشكل مباشر: ماذا تحتاج؟ متى؟ ومن أين؟"
            rows={4}
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary"
          />

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={form.location ?? ""}
              onChange={(e) => update("location", e.target.value)}
              placeholder="المنطقة أو العنوان التقريبي"
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="rounded-2xl bg-secondary px-4 text-sm font-semibold"
              disabled={locating}
            >
              {locating ? "جارٍ..." : "موقعي"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl gradient-hero py-3.5 text-primary-foreground font-display font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={!canSubmit}
          >
            <Send className="w-4 h-4" />
            نشر الفزعة
          </button>
        </form>
      </div>
    </div>
  );
}
