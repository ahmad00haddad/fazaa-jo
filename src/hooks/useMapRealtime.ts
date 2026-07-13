import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FazaaRequest } from "@/lib/fazaa";

export function useMapRealtime(bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null) {
  const [requests, setRequests] = useState<FazaaRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب الطلبات ضمن الإطار المرئي
  const fetchRequestsInView = useCallback(async () => {
    if (!bounds) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("requests_in_view", {
        min_lat: bounds.minLat,
        min_long: bounds.minLng,
        max_lat: bounds.maxLat,
        max_long: bounds.maxLng,
      });

      if (error) {
        console.error("Error fetching requests in view:", error);
        return;
      }
      setRequests((data as any) || []);
    } catch (err) {
      console.error("Unexpected error in requests_in_view:", err);
    } finally {
      setIsLoading(false);
    }
  }, [bounds]);

  // تحديث عند تغير الإطار المرئي
  useEffect(() => {
    fetchRequestsInView();
  }, [fetchRequestsInView]);

  // الاشتراك في التحديثات الحية (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel("public:fazaa_requests:map")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fazaa_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newReq = payload.new as FazaaRequest;
            if (newReq.status === "active" || newReq.status === "in_progress") {
              // Optimistic insert (might be outside view, but that's okay for a moment)
              setRequests((prev) => [newReq, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedReq = payload.new as FazaaRequest;
            setRequests((prev) =>
              prev.map((r) => (r.id === updatedReq.id ? { ...r, ...updatedReq } : r))
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { requests, isLoading, refresh: fetchRequestsInView };
}
