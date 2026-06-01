import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Check, CheckCircle2, Coins, Heart, HandCoins, Loader2, MapPin, MessageCircleMore, Phone, Plus, Send, ShieldCheck, Trash2, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  FAZAA_CATEGORIES,
  FAZAA_URGENCY_OPTIONS,
  JORDAN_CITIES,
  acceptResponse,
  buildMapsUrl,
  buildWhatsAppUrl,
  createRequest,
  declineResponse,
  deleteRequest,
  fetchFeed,
  filterActiveFeed,
  fetchResponderPhone,
  fetchResponsesForRequest,
  formatTimeAgo,
  isFazaaExpired,
  offerHelp,
  suggestFazaaTags,
  updateRequestStatus,
  urgencyVariant,
  type FazaaCategory,
  type FazaaRequest,
  type FazaaResponse,
  type FazaaUrgency,
  type NewFazaaInput,
} from "@/lib/fazaa";
import { Sparkles } from "lucide-react";


function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

const initialForm: NewFazaaInput = {
  need: "",
  category: "أخرى",
  urgency: "عادية", // الافتراضي: عادية (ليست عاجلة أو حرجة)
  location: "",
  female_only: false,
  city: null,
  price_jod: 0,
};

function formatPrice(p: number | null | undefined) {
  const n = Number(p ?? 0);
  if (!n || n <= 0) return "تطوعية (مجاناً)";
  return `${n} د.أ`;
}

export default function Fazaa() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<FazaaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [responsesByRequest, setResponsesByRequest] = useState<Record<string, FazaaResponse[]>>({});
  const [openResponses, setOpenResponses] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const feed = await fetchFeed();
      // أخفِ "العاجلة اليوم" التي تجاوزت 24 ساعة (تبقى طلبات صاحبها مرئية له)
      const visible = feed.filter((r) => r.user_id === user?.id || !isFazaaExpired(r));
      setItems(visible);
      const mine = feed.filter((r) => r.user_id === user?.id);
      const map: Record<string, FazaaResponse[]> = {};
      for (const req of mine) {
        map[req.id] = await fetchResponsesForRequest(req.id);
      }
      setResponsesByRequest(map);
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const myItems = useMemo(
    () => items.filter((i) => i.user_id === user?.id && i.status === "active"),
    [items, user?.id],
  );
  const otherItems = useMemo(
    () => items.filter((i) => i.user_id !== user?.id && i.status === "active"),
    [items, user?.id],
  );

  const handleAdd = async (payload: NewFazaaInput) => {
    if (!user || !profile) return;
    try {
      await createRequest(user.id, profile.name, profile.gender, payload);
      setShowComposer(false);
      toast.success("تم نشر طلب الفزعة");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر النشر");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    try {
      await deleteRequest(id);
      toast.success("تم الحذف");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الحذف");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateRequestStatus(id, "completed");
      toast.success("تم إغلاق الفزعة بنجاح، شكراً للمتعاونين");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الإغلاق");
    }
  };

  const handleOffer = async (req: FazaaRequest, offeredPrice: number | null) => {
    if (!user || !profile) return;
    if (req.female_only && profile.gender !== "female") {
      toast.error("هذه الفزعة للبنات فقط");
      return;
    }
    try {
      const msg = offeredPrice !== null && offeredPrice !== Number(req.price_jod)
        ? `أنا جاهز للمساعدة. أقترح سعر ${offeredPrice} د.أ`
        : "أنا جاهز للمساعدة";
      await offerHelp(req.id, user.id, profile.name, msg, offeredPrice);
      toast.success("تم إرسال استجابتك. سيتواصل معك صاحب الفزعة إذا قبل");
    } catch (e: any) {
      if (e?.code === "23505") toast.info("سبق وأرسلت استجابة لهذا الطلب");
      else toast.error(e?.message ?? "تعذر إرسال الاستجابة");
    }
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <PageHeader title="فزعة المجتمع" subtitle="طلبات مباشرة قابلة للتنفيذ" back={false} />

      <div className="p-4 space-y-4">
        <section className="rounded-3xl gradient-hero p-4 text-primary-foreground shadow-elevated">
          <h2 className="font-display text-xl font-extrabold">إذا كنت بحاجة إلى مساعدة الآن</h2>
          <p className="text-sm opacity-90 mt-2 leading-6">
            اكتب حاجتك، وستظهر مباشرة. رقمك يبقى مخفياً، أنت من يبدأ التواصل مع من يقبل المساعدة.
          </p>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="mt-4 w-full rounded-2xl bg-white/15 py-3 font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <Plus className="w-5 h-5" />
            اطلب فزعة الآن
          </button>
        </section>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {!loading && myItems.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-display font-bold text-sm px-1">طلباتي ({myItems.length})</h3>
            {myItems.map((item) => (
              <MyRequestCard
                key={item.id}
                item={item}
                responses={responsesByRequest[item.id] ?? []}
                open={openResponses === item.id}
                onToggle={() => setOpenResponses((x) => (x === item.id ? null : item.id))}
                onDelete={() => handleDelete(item.id)}
                onComplete={() => handleComplete(item.id)}
                onAccept={async (rid) => {
                  await acceptResponse(rid);
                  toast.success("تم قبول الاستجابة، يمكنك التواصل الآن");
                  await refresh();
                }}
                onDecline={async (rid) => {
                  await declineResponse(rid);
                  toast.success("تم رفض الاستجابة");
                  await refresh();
                }}
              />
            ))}
          </section>
        )}

        {!loading && (
          <section className="space-y-3">
            <h3 className="font-display font-bold text-sm px-1">فزعات تحتاج استجابة</h3>
            {otherItems.length === 0 && (
              <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground">
                لا توجد طلبات أخرى حالياً.
              </div>
            )}
            {otherItems.map((item) => (
              <OtherRequestCard key={item.id} item={item} onOffer={(price) => handleOffer(item, price)} />
            ))}
          </section>
        )}
      </div>

      {showComposer && <RequestComposer onClose={() => setShowComposer(false)} onSubmit={handleAdd} />}
    </div>
  );
}

function MetaBadges({ item }: { item: FazaaRequest }) {
  const price = Number(item.price_jod ?? 0);
  return (
    <>
      {item.requester_verified && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[11px] font-semibold">
          <ShieldCheck className="w-3 h-3" /> موثّق
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
          price > 0 ? "bg-accent/15 text-accent" : "bg-emerald-500/15 text-emerald-700"
        }`}
      >
        <Coins className="w-3 h-3" />
        {formatPrice(price)}
      </span>
      {item.female_only && (
        <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 text-pink-600 px-2 py-1 text-[11px] font-semibold">
          <Heart className="w-3 h-3" /> للبنات فقط
        </span>
      )}
      {item.city && (
        <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.city}</span>
      )}
    </>
  );
}

function OtherRequestCard({ item, onOffer }: { item: FazaaRequest; onOffer: (price: number | null) => void | Promise<void> }) {
  const mapsUrl = buildMapsUrl(item);
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  const askedPrice = Number(item.price_jod ?? 0);
  const [negotiate, setNegotiate] = useState(false);
  const [counter, setCounter] = useState<string>(String(askedPrice));

  const submitCounter = () => {
    const n = Number(counter);
    if (Number.isNaN(n) || n < 0) {
      toast.error("أدخل سعراً صحيحاً");
      return;
    }
    onOffer(n);
    setNegotiate(false);
  };

  return (
    <article className="rounded-3xl bg-card shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
            <MetaBadges item={item} />
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

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={() => onOffer(askedPrice)}
          className="rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          {askedPrice > 0 ? `أقبل بـ ${askedPrice} د.أ` : "أنا جاهز (تطوعي)"}
        </button>
        <a
          href={mapsUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className={`rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 ${mapsUrl ? "bg-secondary" : "bg-muted text-muted-foreground pointer-events-none"}`}
        >
          <MapPin className="w-4 h-4" />
          الموقع
        </a>
      </div>

      {!negotiate ? (
        <button
          type="button"
          onClick={() => setNegotiate(true)}
          className="mt-2 w-full rounded-2xl bg-accent/10 text-accent py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <HandCoins className="w-4 h-4" />
          تفاوض على السعر
        </button>
      ) : (
        <div className="mt-2 rounded-2xl bg-background border border-border p-3 space-y-2">
          <label className="text-[11px] text-muted-foreground">سعرك المقترح بالدينار</label>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <input
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              className="rounded-xl bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            <button
              type="button"
              onClick={submitCounter}
              className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold"
            >
              إرسال العرض
            </button>
            <button
              type="button"
              onClick={() => setNegotiate(false)}
              className="rounded-xl bg-secondary px-3 py-2 text-xs font-semibold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        الدفع كاش بينكما عند اللقاء. رقم صاحب الفزعة مخفي وهو من يتواصل معك إذا قبل.
      </p>
    </article>
  );
}

function MyRequestCard({
  item,
  responses,
  open,
  onToggle,
  onDelete,
  onComplete,
  onAccept,
  onDecline,
}: {
  item: FazaaRequest;
  responses: FazaaResponse[];
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onAccept: (rid: string) => void;
  onDecline: (rid: string) => void;
}) {
  const mapsUrl = buildMapsUrl(item);
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  return (
    <article className="rounded-3xl bg-card shadow-card p-4 border border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-accent/12 px-2 py-1 text-[11px] text-accent">طلبي</span>
            <MetaBadges item={item} />
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

      <button
        type="button"
        onClick={onToggle}
        className="mt-3 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold"
      >
        المستجيبون ({responses.length}) {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {responses.length === 0 && (
            <div className="rounded-2xl bg-background p-3 text-xs text-muted-foreground text-center">
              لا أحد بعد. سيظهر هنا من يعرض المساعدة.
            </div>
          )}
          {responses.map((r) => (
            <ResponseRow
              key={r.id}
              response={r}
              requestName={item.requester_name}
              onAccept={() => onAccept(r.id)}
              onDecline={() => onDecline(r.id)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3">
        <a
          href={mapsUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className={`rounded-2xl py-3 text-center text-xs font-semibold ${mapsUrl ? "bg-secondary" : "bg-muted text-muted-foreground pointer-events-none"}`}
        >
          <MapPin className="w-4 h-4 mx-auto mb-1" />
          موقعي
        </a>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-2xl bg-primary/10 text-primary py-3 text-xs font-semibold"
        >
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
          تم بنجاح
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-2xl bg-destructive/10 text-destructive py-3 text-xs font-semibold"
        >
          <Trash2 className="w-4 h-4 mx-auto mb-1" />
          إلغاء
        </button>
      </div>
    </article>
  );
}

function ResponseRow({
  response,
  requestName,
  onAccept,
  onDecline,
}: {
  response: FazaaResponse;
  requestName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    if (response.accepted) {
      fetchResponderPhone(response.responder_id).then(setPhone);
    }
  }, [response.accepted, response.responder_id]);

  return (
    <div className="rounded-2xl bg-background border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold flex items-center gap-2">
            {response.responder_name}
            {response.offered_price_jod !== null && response.offered_price_jod !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent px-2 py-0.5 text-[11px] font-bold">
                <Coins className="w-3 h-3" />
                {formatPrice(response.offered_price_jod)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">{formatTimeAgo(response.created_at)}</div>
          {response.message && (
            <div className="text-[11px] text-muted-foreground mt-1">{response.message}</div>
          )}
        </div>
        {response.accepted ? (
          <span className="rounded-full bg-primary/12 text-primary px-2 py-1 text-[11px] font-semibold">مقبول</span>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> قبول
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold"
            >
              رفض
            </button>
          </div>
        )}
      </div>

      {response.accepted && phone && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <a
            href={`tel:${phone}`}
            className="rounded-xl bg-secondary py-2 text-center text-xs font-semibold flex items-center justify-center gap-1"
          >
            <Phone className="w-3 h-3" /> اتصال
          </a>
          <a
            href={buildWhatsAppUrl(phone, `مرحباً ${response.responder_name}، أنا ${requestName}، شكراً لاستجابتك لطلبي.`)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-primary text-primary-foreground py-2 text-center text-xs font-semibold flex items-center justify-center gap-1"
          >
            <MessageCircleMore className="w-3 h-3" /> واتساب
          </a>
        </div>
      )}
    </div>
  );
}

function RequestComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: NewFazaaInput) => void }) {
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
