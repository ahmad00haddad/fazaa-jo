import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Check, Loader2, MapPin, MessageCircleMore, Phone, Plus, Send, Trash2, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  FAZAA_CATEGORIES,
  FAZAA_URGENCY_OPTIONS,
  acceptResponse,
  buildMapsUrl,
  buildWhatsAppUrl,
  createRequest,
  declineResponse,
  deleteRequest,
  fetchFeed,
  fetchResponderPhone,
  fetchResponsesForRequest,
  formatTimeAgo,
  offerHelp,
  urgencyVariant,
  type FazaaCategory,
  type FazaaRequest,
  type FazaaResponse,
  type FazaaUrgency,
  type NewFazaaInput,
} from "@/lib/fazaa";

function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

const initialForm: NewFazaaInput = {
  need: "",
  category: "أخرى",
  urgency: "عاجلة اليوم",
  location: "",
};

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
      setItems(feed);
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

  const myItems = useMemo(() => items.filter((i) => i.user_id === user?.id), [items, user?.id]);
  const otherItems = useMemo(() => items.filter((i) => i.user_id !== user?.id), [items, user?.id]);

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

  const handleOffer = async (req: FazaaRequest) => {
    if (!user || !profile) return;
    try {
      await offerHelp(req.id, user.id, profile.name, "أنا جاهز للمساعدة");
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
              <OtherRequestCard key={item.id} item={item} onOffer={() => handleOffer(item)} />
            ))}
          </section>
        )}
      </div>

      {showComposer && <RequestComposer onClose={() => setShowComposer(false)} onSubmit={handleAdd} />}
    </div>
  );
}

function OtherRequestCard({ item, onOffer }: { item: FazaaRequest; onOffer: () => void }) {
  const mapsUrl = buildMapsUrl(item);
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  return (
    <article className="rounded-3xl bg-card shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.category}</span>
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
          onClick={onOffer}
          className="rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          أنا جاهز للمساعدة
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
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        رقم صاحب الفزعة مخفي. هو من سيتواصل معك إذا قبل استجابتك.
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
  onAccept,
  onDecline,
}: {
  item: FazaaRequest;
  responses: FazaaResponse[];
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
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

      <div className="grid grid-cols-2 gap-2 mt-3">
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
          onClick={onDelete}
          className="rounded-2xl bg-destructive/10 text-destructive py-3 text-xs font-semibold"
        >
          <Trash2 className="w-4 h-4 mx-auto mb-1" />
          حذف عند الانتهاء
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
          <div className="text-sm font-bold">{response.responder_name}</div>
          <div className="text-[11px] text-muted-foreground">{formatTimeAgo(response.created_at)}</div>
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
  const [form, setForm] = useState<NewFazaaInput>(initialForm);
  const [locating, setLocating] = useState(false);

  const update = <K extends keyof NewFazaaInput>(k: K, v: NewFazaaInput[K]) =>
    setForm((c) => ({ ...c, [k]: v }));

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
            onChange={(e) => update("need", e.target.value)}
            placeholder="اكتب حاجتك: ماذا تحتاج؟ متى؟ ومن أين؟"
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
              {locating ? "..." : "موقعي"}
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
