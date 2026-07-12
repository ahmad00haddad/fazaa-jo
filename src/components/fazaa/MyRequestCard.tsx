import { MapPin, CheckCircle2, Trash2, PlayCircle, XCircle } from "lucide-react";
import { buildMapsUrl, formatTimeAgo, FazaaRequest, FazaaResponse, urgencyVariant, confirmFazaaCompletion } from "@/lib/fazaa";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  onAccept: (rid: string, responderId: string) => void;
  onDecline: (rid: string) => void;
}) {
  const queryClient = useQueryClient();
  const mapsUrl = buildMapsUrl(item);
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));
  const isInProgress = item.status === "in_progress";
  const isEnded = item.status === "expired" || item.status === "cancelled" || item.status === "completed";

  return (
    <article className="rounded-3xl bg-card shadow-card p-4 border border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-extrabold">{item.requester_name}</span>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${urgencyClass}`}>{item.urgency}</span>
            <span className="rounded-full bg-accent/12 px-2 py-1 text-[11px] text-accent">طلبي</span>
            {isInProgress && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-1 text-[11px] font-bold">
                <PlayCircle className="w-3 h-3" /> قيد التنفيذ
              </span>
            )}
            {isEnded && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2 py-1 text-[11px] font-bold">
                <XCircle className="w-3 h-3" /> منتهية
              </span>
            )}
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

      {!isInProgress && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold"
        >
          المستجيبون ({responses.length}) {open ? "▲" : "▼"}
        </button>
      )}

      {open && !isInProgress && (
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
              onAccept={() => onAccept(r.id, r.responder_id)}
              onDecline={() => onDecline(r.id)}
            />
          ))}
        </div>
      )}

      {isInProgress ? (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await confirmFazaaCompletion(item.id);
                toast.success("تم تأكيد إتمام الفزعة بنجاح");
                queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
                queryClient.invalidateQueries({ queryKey: ['my_requests_history'] });
              } catch (error: any) {
                toast.error(error.message);
              }
            }}
            className="rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
            تأكيد إتمام الفزعة
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-2xl bg-destructive/10 text-destructive py-3 text-xs font-semibold"
          >
            <Trash2 className="w-4 h-4 mx-auto mb-1" />
            إلغاء الفزعة
          </button>
        </div>
      ) : (
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
      )}
    </article>
  );
}
