import PageHeader from "@/components/PageHeader";
import { Crown, Loader2, Medal, ShieldCheck, Trophy } from "lucide-react";
import {
  VERIFIED_HELPER_THRESHOLD,
  fetchMonthlyTopHelper,
  fetchWeeklyLeaderboard,
} from "@/lib/fazaa";
import { useQuery } from "@tanstack/react-query";

export default function Leaderboard() {
  const { data: rows = [], isLoading: loadingRows } = useQuery({
    queryKey: ['weekly_leaderboard'],
    queryFn: () => fetchWeeklyLeaderboard(20),
  });

  const { data: topMonthly = null, isLoading: loadingTop } = useQuery({
    queryKey: ['monthly_top_helper'],
    queryFn: fetchMonthlyTopHelper,
  });

  const loading = loadingRows || loadingTop;

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      <PageHeader title="لوحة الشرف" subtitle="أبطال الفزعات في الأردن" />

      <div className="p-4 space-y-4">
        {/* Abu Al-Fazaat — monthly top */}
        <section className="rounded-3xl gradient-hero p-5 text-primary-foreground shadow-elevated">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs opacity-90">بطل الشهر</div>
              <div className="font-display text-xl font-extrabold mt-0.5">
                {topMonthly ? `أبو الفزعات: ${topMonthly.name}` : "لم يُتوَّج بعد"}
              </div>
              {topMonthly && (
                <div className="text-xs opacity-90 mt-1">
                  {topMonthly.city ? `${topMonthly.city} · ` : ""}
                  {topMonthly.completed_count} فزعة منجزة هذا الشهر
                </div>
              )}
              {!topMonthly && (
                <div className="text-xs opacity-90 mt-1">كن أول من ينال لقب أبو الفزعات هذا الشهر</div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-card shadow-card p-4">
          <h2 className="font-display text-base font-extrabold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            أبطال هذا الأسبوع
          </h2>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground text-center">
              لا توجد فزعات منجزة هذا الأسبوع بعد.
            </div>
          )}

          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li
                key={r.user_id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                  i === 0
                    ? "bg-accent/15"
                    : i < 3
                    ? "bg-primary/8"
                    : "bg-background border border-border"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-sm shrink-0 ${
                    i === 0
                      ? "bg-accent text-accent-foreground"
                      : i === 1
                      ? "bg-primary/15 text-primary"
                      : i === 2
                      ? "bg-secondary text-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < 3 ? <Medal className="w-4 h-4" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                    {r.name}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                        <ShieldCheck className="w-2.5 h-2.5" /> موثّق
                      </span>
                    )}
                    {r.completed_count >= VERIFIED_HELPER_THRESHOLD && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent px-1.5 py-0.5 text-[10px] font-bold">
                        فزّيع موثّق
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {r.city ?? "—"}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <div className="font-display text-lg font-extrabold">{r.completed_count}</div>
                  <div className="text-[10px] text-muted-foreground">فزعة</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-[11px] text-muted-foreground text-center px-4 leading-5">
          الترتيب يُحسب من الفزعات المنجزة خلال آخر 7 أيام. بطل الشهر يُتوّج بلقب "أبو الفزعات" كل شهر.
        </p>
      </div>
    </div>
  );
}
