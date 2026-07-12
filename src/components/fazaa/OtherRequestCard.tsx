import { useState } from "react";
import { MapPin, UserCheck, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { buildMapsUrl, formatTimeAgo, FazaaRequest, urgencyVariant } from "@/lib/fazaa";
import { badgeClass } from "./utils";
import { MetaBadges } from "./MetaBadges";

export function OtherRequestCard({ item, onOffer }: { item: FazaaRequest; onOffer: (price: number | null) => void | Promise<void> }) {
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
