import { useState } from "react";
import { X, Sparkles, Coins, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FAZAA_CATEGORIES, FAZAA_URGENCY_OPTIONS, JORDAN_CITIES, suggestFazaaTags, NewFazaaInput, FazaaCategory, FazaaUrgency } from "@/lib/fazaa";

const initialForm: NewFazaaInput = {
  need: "",
  category: "أخرى",
  urgency: "عادية",
  location: "",
  female_only: false,
  city: null,
  price_jod: 0,
};

export function RequestComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: NewFazaaInput) => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState<NewFazaaInput>({ ...initialForm, city: profile?.city ?? null });
  const [locating, setLocating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(false);

  const update = <K extends keyof NewFazaaInput>(k: K, v: NewFazaaInput[K]) =>
    setForm((c) => ({ ...c, [k]: v }));

  const runSuggest = async () => {
    if (suggesting) return;
    if (form.need.trim().length < 5) {
      toast.info("اكتب وصف الحاجة أولاً");
      return;
    }
    setSuggesting(true);
    try {
      const s = await suggestFazaaTags(form.need);
      if (s) {
        setForm((c) => ({ ...c, category: s.category, urgency: s.urgency }));
        setSuggested(true);
        toast.success(`اقتراح: ${s.category} · ${s.urgency}`);
      } else {
        toast.error("تعذّر الاقتراح. اختر يدوياً.");
      }
    } finally {
      setSuggesting(false);
    }
  };

  const canSubmit = form.need.trim().length > 0;

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("الموقع غير مدعوم");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", Number(pos.coords.latitude.toFixed(5)));
        update("longitude", Number(pos.coords.longitude.toFixed(5)));
        update("location", `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return toast.error("اكتب وصف الحاجة");
    onSubmit({ ...form, need: form.need.trim(), location: form.location?.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-t-[28px] bg-background p-5 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-extrabold">طلب فزعة جديد</h2>
            <p className="text-xs text-muted-foreground mt-1">رقمك يبقى مخفياً، وأنت من يبدأ التواصل</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as FazaaCategory)}
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {FAZAA_CATEGORIES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <select
              value={form.urgency}
              onChange={(e) => update("urgency", e.target.value as FazaaUrgency)}
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {FAZAA_URGENCY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <textarea
            value={form.need}
            onChange={(e) => {
              update("need", e.target.value);
              if (suggested) setSuggested(false);
            }}
            placeholder="اكتب حاجتك: ماذا تحتاج؟ متى؟ ومن أين؟"
            rows={4}
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={runSuggest}
            disabled={suggesting || form.need.trim().length < 5}
            className="w-full rounded-2xl bg-accent/10 text-accent py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {suggesting
              ? "جارٍ الاقتراح..."
              : suggested
              ? `✓ اقتراح ذكي: ${form.category} · ${form.urgency} (يمكن تعديله)`
              : "اقتراح التصنيف والاستعجال بالذكاء الاصطناعي"}
          </button>

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
              {locating ? "..." : "موقعي"}
            </button>
          </div>
          <select
            value={form.city ?? ""}
            onChange={(e) => update("city", (e.target.value || null) as any)}
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">اختر المدينة</option>
            {JORDAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Price */}
          <div className="rounded-2xl bg-secondary p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-accent" />
                عربون الشكر (د.أ)
              </span>
              <span className="text-[11px] text-muted-foreground">0 = تطوعية</span>
            </div>
            <div className="grid grid-cols-6 gap-1 mb-2">
              {[0, 1, 2, 5, 10, 20].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("price_jod", v)}
                  className={`rounded-xl py-2 text-xs font-bold ${
                    Number(form.price_jod) === v ? "bg-primary text-primary-foreground" : "bg-background"
                  }`}
                >
                  {v === 0 ? "مجاناً" : v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              value={form.price_jod}
              onChange={(e) => update("price_jod", Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground mt-2 leading-5">
              المبلغ يُدفع كاش بينك وبين الفازع عند اللقاء. يمكن للفازع أن يفاوضك على السعر قبل القبول.
            </p>
          </div>

          {profile?.gender === "female" && (
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600" />
                للبنات فقط (لن يستجيب لها إلا الإناث)
              </span>
              <input
                type="checkbox"
                checked={!!form.female_only}
                onChange={(e) => update("female_only", e.target.checked)}
                className="w-5 h-5 accent-primary"
              />
            </label>
          )}
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
