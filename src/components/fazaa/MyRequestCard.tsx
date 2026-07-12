import { MapPin, CheckCircle2, Trash2 } from "lucide-react";
import { buildMapsUrl, formatTimeAgo, FazaaRequest, FazaaResponse, urgencyVariant } from "@/lib/fazaa";
import { badgeClass } from "./utils";
import { MetaBadges } from "./MetaBadges";
import { ResponseRow } from "./ResponseRow";

export function MyRequestCard({
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
