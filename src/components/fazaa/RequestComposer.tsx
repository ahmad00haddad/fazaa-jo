import { useState } from "react";
import { X, Sparkles, Coins, Heart, Send } from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FAZAA_CATEGORIES, FAZAA_URGENCY_OPTIONS, JORDAN_CITIES, suggestFazaaTags, NewFazaaInput, FazaaCategory, FazaaUrgency } from "@/lib/fazaa";

const initialForm: NewFazaaInput = {
  need: "",
  category: "أخرى",
  urgency: "عادية",
  location: "",
  female_only: false, // will map to gender_visibility
  gender_visibility: "all",
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
    <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[32px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] shadow-elevated focus:outline-none">
          <div className="p-4 bg-background rounded-t-[32px] flex-1 overflow-y-auto no-scrollbar">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold">طلب فزعة جديد</h2>
                <p className="text-sm text-muted-foreground mt-1">رقمك يبقى مخفياً، وأنت من يبدأ التواصل</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4 pb-12">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value as FazaaCategory)}
                  className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                >
                  {FAZAA_CATEGORIES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <select
                  value={form.urgency}
                  onChange={(e) => update("urgency", e.target.value as FazaaUrgency)}
                  className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
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
                placeholder="اكتب حاجتك بدقة: ماذا تحتاج؟ متى؟ ومن أين؟"
                rows={4}
                className="w-full rounded-2xl bg-secondary px-4 py-4 text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/70"
              />
              
              <button
                type="button"
                onClick={runSuggest}
                disabled={suggesting || form.need.trim().length < 5}
                className="w-full rounded-2xl bg-accent/10 text-accent py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" />
                {suggesting
                  ? "جارٍ الاقتراح..."
                  : suggested
                  ? `✓ اقتراح ذكي: ${form.category} · ${form.urgency}`
                  : "اقتراح التصنيف بالذكاء الاصطناعي"}
              </button>

              <div className="grid grid-cols-[1fr_auto] gap-3 pt-2">
                <input
                  value={form.location ?? ""}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="المنطقة أو العنوان التقريبي"
                  className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="rounded-2xl bg-secondary px-5 text-sm font-bold transition-transform active:scale-[0.95]"
                  disabled={locating}
                >
                  {locating ? "..." : "موقعي"}
                </button>
              </div>
              
              <select
                value={form.city ?? ""}
                onChange={(e) => update("city", (e.target.value || null) as any)}
                className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر المدينة (أو سيتم تخمينها من موقعك)</option>
                {JORDAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Price Section */}
              <div className="rounded-3xl bg-secondary p-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Coins className="w-5 h-5 text-accent" />
                    عربون الشكر (د.أ)
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 bg-background rounded-md text-muted-foreground">0 = تطوعية مجانية</span>
                </div>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[0, 1, 2, 5, 10, 20].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => update("price_jod", v)}
                      className={`rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                        Number(form.price_jod) === v ? "bg-primary text-primary-foreground shadow-glow scale-105" : "bg-background text-foreground/80 hover:bg-background/80"
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
                  className="w-full rounded-xl bg-background px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                  dir="ltr"
                />
                <p className="text-[11px] text-muted-foreground/80 mt-3 leading-snug">
                  * المبلغ يُدفع كاش بينك وبين الفازع عند اللقاء. يمكن للفازع أن يفاوضك على السعر قبل قبول الفزعة.
                </p>
              </div>

              {/* Gender Privacy */}
              <div className="space-y-2 mt-2">
                <label className="text-sm font-bold block px-1">لمن تود أن تظهر هذه الفزعة؟</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => update("gender_visibility", "all")}
                    className={`rounded-2xl py-3.5 text-sm font-bold transition-all ${
                      form.gender_visibility === "all" ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    للجميع
                  </button>
                  {profile?.gender === "female" && (
                    <button
                      type="button"
                      onClick={() => update("gender_visibility", "female_only")}
                      className={`rounded-2xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        form.gender_visibility === "female_only" ? "bg-pink-600 text-white shadow-[0_0_20px_rgba(219,39,119,0.3)]" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      للبنات فقط
                    </button>
                  )}
                  {profile?.gender === "male" && (
                    <button
                      type="button"
                      onClick={() => update("gender_visibility", "male_only")}
                      className={`rounded-2xl py-3.5 text-sm font-bold transition-all ${
                        form.gender_visibility === "male_only" ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      للشباب فقط
                    </button>
                  )}
                </div>
                {(form.gender_visibility === "female_only" || form.gender_visibility === "male_only") && (
                  <p className="text-xs text-muted-foreground px-1">
                    * خصوصية تامة: سيتم إخفاء هذا الطلب بالكامل عن الجنس الآخر.
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full rounded-full btn-brand py-4 text-primary-foreground font-display text-lg font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
                  disabled={!canSubmit}
                >
                  <Send className="w-5 h-5" />
                  انشر الفزعة
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
