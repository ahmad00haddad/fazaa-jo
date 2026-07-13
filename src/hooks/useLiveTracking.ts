import { useEffect, useRef, useState } from "react";
import { Geolocation, Position } from "@capacitor/geolocation";
import { supabase } from "@/integrations/supabase/client";

export function useLiveTracking(isActive: boolean, requestId: string | null) {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const watchIdRef = useRef<string | null>(null);
  const locationQueueRef = useRef<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== "granted") {
          const req = await Geolocation.requestPermissions();
          if (req.location !== "granted") {
            console.error("Location permission denied for live tracking");
            return;
          }
        }

        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
          (position, err) => {
            if (err || !position) {
              console.error("Watch position error:", err);
              return;
            }
            if (isMounted) {
              setCurrentPosition(position);
              
              if (requestId) {
                locationQueueRef.current.push({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });

                // Batching: Update Supabase every 3 points to save battery
                if (locationQueueRef.current.length >= 3) {
                  const latest = locationQueueRef.current[locationQueueRef.current.length - 1];
                  locationQueueRef.current = [];
                  
                  // Optimistically update location in background
                  supabase
                    .from("fazaa_requests")
                    .update({ 
                      latitude: latest.lat, 
                      longitude: latest.lng 
                    })
                    .eq("id", requestId)
                    .then(({ error }) => {
                      if (error) console.error("Error updating location batch:", error);
                    });
                }
              }
            }
          }
        );
        watchIdRef.current = id;
      } catch (err) {
        console.error("Live tracking initialization failed:", err);
      }
    };

    if (isActive && requestId) {
      startTracking();
    }

    return () => {
      isMounted = false;
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }
    };
  }, [isActive, requestId]);

  return { currentPosition };
}
