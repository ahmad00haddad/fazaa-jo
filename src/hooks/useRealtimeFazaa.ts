import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isFazaaExpired, type FazaaRequest } from "@/lib/fazaa";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtimeFazaa(_onUpdate?: () => void) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const city = profile?.city ?? "عمّان";
    const channel = supabase
      .channel(`fazaa_global_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fazaa_requests", filter: `city=eq.${city}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
          queryClient.invalidateQueries({ queryKey: ['active_feed_stats'] });
          queryClient.invalidateQueries({ queryKey: ['my_requests_history'] });

          if (payload.eventType === 'INSERT') {
            const req = payload.new as FazaaRequest;
            if (req.user_id === user.id) return;
            if (req.status && req.status !== "active") return;
            if (isFazaaExpired(req)) return;
            // Female-only: skip notifying males entirely
            if (req.female_only && profile?.gender !== "female") return;
            const title = `فزعة جديدة: ${req.category}`;
            const body = req.need.length > 90 ? req.need.slice(0, 90) + "…" : req.need;
            toast(title, { description: body });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as any;
          if (n.user_id !== user.id) return;
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast(n.title, { description: n.body });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fazaa_responses' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fazaa_responses_all'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.gender, profile?.city, queryClient]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return await Notification.requestPermission();
}
