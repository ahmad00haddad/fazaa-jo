import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import Map, { Source, Layer, MapRef, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapRealtime } from "@/hooks/useMapRealtime";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { FazaaRequest } from "@/lib/fazaa";
import { Loader2 } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

// MapTiler key from user
const MAPTILER_KEY = "hdPRLQfGkm2GZU95NrFi";

export default function FazaaMap() {
  const mapRef = useRef<MapRef>(null);
  const [bounds, setBounds] = useState<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);
  const [selectedReq, setSelectedReq] = useState<FazaaRequest | null>(null);
  
  // Debounce boundary changes
  const boundsTimeout = useRef<NodeJS.Timeout>();

  const onMoveEnd = useCallback((e: any) => {
    if (boundsTimeout.current) clearTimeout(boundsTimeout.current);
    boundsTimeout.current = setTimeout(() => {
      const b = e.target.getBounds();
      setBounds({
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth(),
      });
    }, 300); // 300ms debounce
  }, []);

  const { requests, isLoading } = useMapRealtime(bounds);
  
  // Convert requests to GeoJSON
  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: requests
        .filter((req) => req.longitude != null && req.latitude != null)
        .map((req) => ({
          type: "Feature",
          properties: {
            id: req.id,
            category: req.category,
            urgency: req.urgency,
            status: req.status,
            price_jod: req.price_jod,
          },
          geometry: {
            type: "Point",
            coordinates: [req.longitude!, req.latitude!],
          },
        })),
    };
  }, [requests]);

  const onMapClick = useCallback((e: any) => {
    const feature = e.features && e.features[0];
    if (feature && feature.layer.id === "unclustered-point") {
      const clickedId = feature.properties.id;
      const req = requests.find((r) => r.id === clickedId);
      if (req) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        setSelectedReq(req);
      }
    }
  }, [requests]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-zinc-100 flex flex-col">
      {isLoading && !bounds && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 35.9283,
          latitude: 31.9454,
          zoom: 12,
        }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
        onMoveEnd={onMoveEnd}
        onClick={onMapClick}
        interactiveLayerIds={["unclustered-point"]}
        style={{ width: "100%", height: "100%" }}
      >
        <Source
          id="fazaa-requests"
          type="geojson"
          data={geojson as any}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Clusters */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#22c55e",
              "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 50, 30],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff"
            }}
          />
          {/* Cluster Counts */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Noto Sans Bold"],
              "text-size": 14,
            }}
            paint={{
              "text-color": "#ffffff"
            }}
          />
          {/* Unclustered Points */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-radius": 10,
              "circle-color": [
                "match",
                ["get", "urgency"],
                "حرجة", "#ef4444",      // أحمر نابض
                "عاجلة اليوم", "#f97316", // برتقالي
                "#A457DB"                // بنفسجي للطلب العادي
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>

        {/* Optimistic / New Request Pulse Animation Example */}
        {requests.slice(0, 1).map((req, i) => (
          i === 0 && (Date.now() - new Date(req.created_at).getTime() < 10000) ? (
            <Marker key={`new-${req.id}`} longitude={req.longitude!} latitude={req.latitude!}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-lg"
              />
            </Marker>
          ) : null
        ))}
      </Map>

      {/* Bottom Sheet for Request Details */}
      <Drawer.Root open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] bg-zinc-900 border-t border-zinc-800">
            <div className="flex-1 rounded-t-[10px] bg-zinc-900 p-4 rtl">
              <div className="mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-zinc-700" />
              {selectedReq && (
                <div className="text-white space-y-3">
                  <h3 className="text-xl font-bold text-emerald-400">{selectedReq.category}</h3>
                  <p className="text-zinc-300">{selectedReq.need}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                      إلحاح: {selectedReq.urgency}
                    </span>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                      التكلفة: {selectedReq.price_jod} دينار
                    </span>
                  </div>
                  <button className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-bold">
                    عرض التفاصيل والفزعة
                  </button>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
