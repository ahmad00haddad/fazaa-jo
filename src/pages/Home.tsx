import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Bell, HeartHandshake, ShieldCheck, Zap, ArrowLeft, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchFeed, filterActiveFeed, formatTimeAgo, urgencyVariant, type FazaaRequest } from "@/lib/fazaa";
import InstallPWAButton from "@/components/InstallPWAButton";
import ThemeToggle from "@/components/ThemeToggle";

function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export default function Home() {
  const nav = useNavigate();
  const { profile, user } = useAuth();

  const { data: feed = [], isLoading: loadingFeed } = useQuery({
    queryKey: ['fazaa_feed'],
    queryFn: fetchFeed,
  });

  const activeItems = filterActiveFeed(feed, { viewerGender: profile?.gender, viewerId: user?.id });
  // Show only 3 latest items on Home
  const latestItems = activeItems.slice(0, 3);

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      {/* 1. Header (Clean & Simple) */}
      <header className="safe-top border-b border-border/40 glass-strong sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary">فزعة</h1>
            <p className="text-[11px] text-muted-foreground font-medium">مساعدة فورية بين الناس</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <InstallPWAButton />
            {profile && (
              <button
                type="button"
                onClick={() => nav("/notifications")}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative text-foreground/80 hover:text-foreground transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
            {!profile && (
              <button
                onClick={() => nav("/auth")}
                className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full"
              >
                دخول
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Clear CTAs) */}
      <section className="px-4 pt-8 pb-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-extrabold mb-3">
            تحتاج مساعدة؟ أو تقدر تفزع؟
          </h2>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
            فزعة تربط بين من يحتاج الدعم السريع في الأردن، وبين النشامى الجاهزين لتقديم يد العون.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => nav("/fazaa?action=new")}
            className="flex flex-col items-center justify-center gap-3 bg-primary text-primary-foreground p-5 rounded-3xl shadow-glow"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-base">طلب فزعة</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => nav("/fazaa")}
            className="flex flex-col items-center justify-center gap-3 bg-card border border-border text-foreground p-5 rounded-3xl shadow-soft"
          >
            <div className="w-12 h-12 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-base">تقديم مساعدة</span>
          </motion.button>
        </div>
      </section>

      {/* 3. How it works (كيف نعمل) */}
      <section className="px-4 py-6 bg-secondary/50 my-2">
        <h3 className="font-display text-lg font-bold mb-4 text-center">كيف تعمل المنصة؟</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold">1</div>
            <div>
              <div className="font-bold text-sm">اطلب فزعة أو تصفح الطلبات</div>
              <div className="text-xs text-muted-foreground mt-0.5">انشر طلبك بثوانٍ أو ابحث عن شخص يحتاج مساعدتك في منطقتك.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 font-bold"><Zap className="w-4 h-4" /></div>
            <div>
              <div className="font-bold text-sm">تواصل آمن وسريع</div>
              <div className="text-xs text-muted-foreground mt-0.5">استقبل العروض، واختر من يناسبك. رقمك يبقى مخفياً حتى توافق.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 font-bold"><ShieldCheck className="w-4 h-4" /></div>
            <div>
              <div className="font-bold text-sm">إنجاز وثقة</div>
              <div className="text-xs text-muted-foreground mt-0.5">أغلق الطلب عند اكتماله. مجتمع الفزعة مبني على التعاون والثقة.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Top Active Requests (أبرز الطلبات النشطة) */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">أحدث الفزعات</h3>
          <button onClick={() => nav("/fazaa")} className="text-sm font-bold text-primary flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {loadingFeed ? (
            // Skeleton Loading
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted mb-2" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            ))
          ) : latestItems.length > 0 ? (
            latestItems.map((item) => <PreviewCard key={item.id} item={item} onOpen={() => nav("/fazaa")} />)
          ) : (
            <div className="rounded-2xl bg-secondary p-6 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 opacity-50" />
              لا توجد طلبات نشطة حالياً.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PreviewCard({ item, onOpen }: { item: FazaaRequest; onOpen: () => void }) {
  const urgencyClass = badgeClass(urgencyVariant(item.urgency));

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      className="w-full text-right rounded-2xl border border-border bg-card p-4 shadow-soft active:shadow-none transition-all block"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${urgencyClass}`}>{item.urgency}</span>
          <span className="text-[11px] font-semibold text-muted-foreground">{item.category}</span>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatTimeAgo(item.created_at)}</span>
      </div>
      
      <p className="text-sm font-medium leading-relaxed line-clamp-2 text-foreground/90">{item.need}</p>
      
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.city || "الأردن"}</span>
        </div>
        <div className="font-semibold text-primary">المزيد التفاصيل ←</div>
      </div>
    </motion.button>
  );
}
