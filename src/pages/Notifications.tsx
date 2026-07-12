import { useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsRead, formatTimeAgo } from "@/lib/fazaa";
import { Link } from "react-router-dom";

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

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="الإشعارات" subtitle="آخر التنبيهات" back />
      
      <div className="p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        
        {!isLoading && notifications.length === 0 && (
          <div className="rounded-3xl bg-card shadow-card p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
             <Bell className="w-8 h-8 opacity-20" />
             لا توجد إشعارات جديدة.
          </div>
        )}

        {notifications.map(n => (
          <Link key={n.id} to={n.link ?? "#"} className={`block rounded-3xl p-4 shadow-card transition-transform active:scale-[0.98] ${n.read ? 'bg-card' : 'bg-primary/5 border border-primary/20'}`}>
             <div className="flex justify-between items-start mb-1">
               <h3 className="font-display font-bold text-sm">{n.title}</h3>
               <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(n.created_at)}</span>
             </div>
             <p className="text-xs text-muted-foreground leading-5">{n.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
