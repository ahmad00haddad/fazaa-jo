import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { CheckCircle2, Clock, XCircle, AlertTriangle, HandHeart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyResponses, formatTimeAgo, type FazaaRequest } from "@/lib/fazaa";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "requests" | "responses";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  active:      { label: "نشطة",            icon: <Clock className="w-3 h-3" />,          cls: "bg-accent/12 text-accent" },
  in_progress: { label: "قيد التنفيذ",     icon: <HandHeart className="w-3 h-3" />,      cls: "bg-primary/12 text-primary" },
  completed:   { label: "منجزة",           icon: <CheckCircle2 className="w-3 h-3" />,   cls: "bg-emerald-500/12 text-emerald-600" },
  cancelled:   { label: "ملغاة",           icon: <XCircle className="w-3 h-3" />,        cls: "bg-destructive/10 text-destructive" },
  expired:     { label: "انتهت صلاحيتها", icon: <AlertTriangle className="w-3 h-3" />,   cls: "bg-muted text-muted-foreground" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// Skeleton row
function SkeletonRow() {
  return (
    <div className="rounded-2xl bg-card shadow-card p-4 animate-pulse space-y-2">
      <div className="flex gap-2">
        <div className="h-4 w-24 rounded-full bg-muted" />
        <div className="h-4 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export default function History() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");

  const { data: mine = [], isLoading: loadingMine } = useQuery({
    queryKey: ['my_requests_history', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("fazaa_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as FazaaRequest[];
    },
    enabled: !!user?.id,
  });

  const { data: responses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ['my_responses_history', user?.id],
    queryFn: () => fetchMyResponses(user!.id),
    enabled: !!user?.id,
  });

  const loading = loadingMine || loadingResponses;

  // Stats summary
  const completed = mine.filter(r => r.status === "completed").length;
  const givenHelp = responses.filter(r => r.accepted).length;

  return (
    <div className="pb-28">
      <PageHeader title="سجلّي" subtitle="فزعاتك السابقة واستجاباتك" back />

      <div className="px-4 pt-2 pb-4 space-y-4">

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card shadow-card p-3 text-center">
            <div className="text-2xl font-display font-extrabold text-primary">{completed}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">فزعة أنجزتها</div>
          </div>
          <div className="rounded-2xl bg-card shadow-card p-3 text-center">
            <div className="text-2xl font-display font-extrabold text-accent">{givenHelp}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">مرة ساعدت فيها</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-secondary rounded-2xl p-1">
          {(["requests", "responses"] as Tab[]).map((t) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t)}
              className={`py-2.5 text-sm rounded-xl font-semibold transition-all duration-200 relative min-h-[44px] ${
                tab === t ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "requests"
                ? `فزعاتي (${mine.length})`
                : `استجاباتي (${responses.length})`}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {loading && [1,2,3].map(i => <SkeletonRow key={i} />)}

            {!loading && tab === "requests" && (
              <>
                {mine.length === 0 && (
                  <EmptyState 
                    icon={HandHeart}
                    title="لا توجد فزعات"
                    description="لا توجد فزعات سابقة بعد."
                  />
                )}
                {mine.map((r, i) => (
                  <motion.article
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl bg-card shadow-card p-4"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm">{r.category}</span>
                        <StatusBadge status={r.status} />
                        {r.city && (
                          <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{r.city}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{formatTimeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-sm leading-6 mt-2 text-foreground/80">{r.need}</p>
                  </motion.article>
                ))}
              </>
            )}

            {!loading && tab === "responses" && (
              <>
                {responses.length === 0 && (
                  <EmptyState 
                    icon={CheckCircle2}
                    title="لا توجد استجابات"
                    description="لم تستجب لأي فزعة بعد."
                  />
                )}
                {responses.map((r, i) => {
                  const req = r.fazaa_requests;
                  return (
                    <motion.article
                      key={r.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl bg-card shadow-card p-4"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm">{req?.category ?? "فزعة"}</span>
                          {r.accepted ? (
                            <span className="rounded-full bg-primary/12 text-primary px-2 py-1 text-[11px] font-semibold">قُبلت استجابتك ✓</span>
                          ) : (
                            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">بانتظار الرد</span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{formatTimeAgo(r.created_at)}</span>
                      </div>
                      {req && <p className="text-sm leading-6 mt-2 text-foreground/80">{req.need}</p>}
                    </motion.article>
                  );
                })}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
