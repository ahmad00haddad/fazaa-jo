import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isFazaaExpired, type FazaaRequest } from "@/lib/fazaa";

/**
 * Subscribes to live Fazaa request inserts and surfaces a toast +
 * browser notification (when permitted), excluding the user's own posts
 * and respecting female-only filtering.
 */
export function useRealtimeFazaa(onNew?: (req: FazaaRequest) => void) {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("fazaa_requests_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fazaa_requests" },
        (payload) => {
          const req = payload.new as FazaaRequest;
          if (req.user_id === user.id) return;
          if (req.status && req.status !== "active") return;
          if (isFazaaExpired(req)) return;
          // Female-only: skip notifying males entirely
          if (req.female_only && profile?.gender !== "female") return;
          onNew?.(req);
          const title = `فزعة جديدة: ${req.category}`;
          const body = req.need.length > 90 ? req.need.slice(0, 90) + "…" : req.need;
          toast(title, { description: body });
          try {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(title, { body, tag: req.id });
            }
          } catch {
            /* ignore */
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.gender, onNew]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return await Notification.requestPermission();
}
