import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { CheckCircle2, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyResponses, formatTimeAgo, type FazaaRequest } from "@/lib/fazaa";

type Tab = "requests" | "responses";

export default function History() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("requests");
  const [mine, setMine] = useState<FazaaRequest[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("fazaa_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setMine((data ?? []) as FazaaRequest[])),
      fetchMyResponses(user.id).then(setResponses),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="السجل" subtitle="فزعاتك السابقة واستجاباتك" back />

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 bg-secondary rounded-2xl p-1">
          <button
            onClick={() => setTab("requests")}
            className={`py-2 text-sm rounded-xl font-semibold ${tab === "requests" ? "bg-card shadow" : ""}`}
          >
            فزعاتي ({mine.length})
          </button>
          <button
            onClick={() => setTab("responses")}
            className={`py-2 text-sm rounded-xl font-semibold ${tab === "responses" ? "bg-card shadow" : ""}`}
          >
            استجاباتي ({responses.length})
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {!loading && tab === "requests" && (
          <div className="space-y-2">
            {mine.length === 0 && (
              <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
                لا توجد فزعات سابقة بعد.
              </div>
            )}
            {mine.map((r) => (
              <article key={r.id} className="rounded-2xl bg-card shadow-card p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm">{r.category}</span>
                    <StatusBadge status={r.status} />
                    {r.city && <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{r.city}</span>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatTimeAgo(r.created_at)}</span>
                </div>
                <p className="text-sm leading-6 mt-2">{r.need}</p>
              </article>
            ))}
          </div>
        )}

        {!loading && tab === "responses" && (
          <div className="space-y-2">
            {responses.length === 0 && (
              <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
                لم تستجب لأي فزعة بعد.
              </div>
            )}
            {responses.map((r) => {
              const req = r.fazaa_requests;
              return (
                <article key={r.id} className="rounded-2xl bg-card shadow-card p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm">{req?.category ?? "فزعة"}</span>
                      {r.accepted ? (
                        <span className="rounded-full bg-primary/12 text-primary px-2 py-1 text-[11px] font-semibold">قُبلت استجابتك</span>
                      ) : (
                        <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">بانتظار الرد</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{formatTimeAgo(r.created_at)}</span>
                  </div>
                  {req && <p className="text-sm leading-6 mt-2">{req.need}</p>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 text-primary px-2 py-1 text-[11px] font-semibold">
        <CheckCircle2 className="w-3 h-3" /> منجزة
      </span>
    );
  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-1 text-[11px] font-semibold">
        <XCircle className="w-3 h-3" /> ملغاة
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 text-accent px-2 py-1 text-[11px] font-semibold">
      <Clock className="w-3 h-3" /> نشطة
    </span>
  );
}
