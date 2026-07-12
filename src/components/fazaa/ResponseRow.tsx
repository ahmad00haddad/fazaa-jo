import { useState, useEffect } from "react";
import { Check, Phone, MessageCircleMore, Coins } from "lucide-react";
import { fetchResponderPhone, formatTimeAgo, buildWhatsAppUrl, FazaaResponse } from "@/lib/fazaa";
import { formatPrice } from "./utils";

export function ResponseRow({
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
