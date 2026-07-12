import { useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Bell, Zap, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsRead, formatTimeAgo } from "@/lib/fazaa";
import { Link } from "react-router-dom";

function SkeletonNotif() {
  return (
    <div className="rounded-2xl bg-card p-4 animate-pulse space-y-2">
      <div className="flex justify-between">
        <div className="h-4 w-32 rounded-full bg-muted" />
        <div className="h-3 w-14 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-full rounded bg-muted" />
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user?.id,
  });

  const markRead = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  useEffect(() => {
    if (notifications.some(n => !n.read)) {
      markRead.mutate();
    }
  }, [notifications]);

  // Separate fazaa-related from general
  const fazaaNotifs  = notifications.filter(n => n.link?.includes("fazaa") || n.title.includes("فزعة"));
  const generalNotifs = notifications.filter(n => !fazaaNotifs.includes(n));

  return (
    <div className="pb-28">
      <PageHeader title="الإشعارات" subtitle="آخر التنبيهات والتحديثات" back />

      <div className="px-4 pt-2 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <SkeletonNotif key={i} />)}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-card shadow-card p-10 text-center flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
              <Bell className="w-7 h-7 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة.</p>
          </motion.div>
        )}

        {/* Fazaa Notifications (highlighted) */}
        {!isLoading && fazaaNotifs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">إشعارات الفزعة</span>
            </div>
            <div className="space-y-2">
              {fazaaNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={n.link ?? "#"}
                    className={`block rounded-2xl p-4 transition-all active:scale-[0.98] shadow-soft ${
                      n.read
                        ? "bg-card"
                        : "bg-primary/6 border border-primary/25 shadow-card"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />}
                        <h3 className="font-display font-bold text-sm">{n.title}</h3>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mr-2">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-5 pr-4">{n.body}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* General Notifications */}
        {!isLoading && generalNotifs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">تحديثات عامة</span>
            </div>
            <div className="space-y-2">
              {generalNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={n.link ?? "#"}
                    className="block rounded-2xl bg-card shadow-soft p-4 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-display font-bold text-sm">{n.title}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0 mr-2">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-5">{n.body}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
