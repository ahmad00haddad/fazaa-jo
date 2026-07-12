import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FazaaRequest, buildMapsUrl, formatTimeAgo } from '@/lib/fazaa';
import { MapPin, Navigation } from 'lucide-react';
import { badgeClass } from './utils';

// Fix leaflet default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Create custom icons based on urgency
const getCustomIcon = (urgency: string) => {
  const color = urgency === "حرجة" ? "#ef4444" : urgency === "عاجلة اليوم" ? "#f59e0b" : "#5e2ca5";
  
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
  
  return L.divIcon({
    html: svgIcon,
    className: 'bg-transparent border-none',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function FazaaMap({ items, onOpen }: { items: FazaaRequest[], onOpen: (item: FazaaRequest) => void }) {
  const mapItems = items.filter(i => i.latitude != null && i.longitude != null);
  
  // Default to Amman if no items
  const center: [number, number] = mapItems.length > 0 && mapItems[0].latitude && mapItems[0].longitude 
    ? [mapItems[0].latitude, mapItems[0].longitude] 
    : [31.9522, 35.9334];

  if (mapItems.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-3xl bg-secondary/50 flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-border">
        <MapPin className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm font-semibold">لا توجد فزعات نشطة بمواقع جغرافية محددة حالياً.</p>
      </div>
    );
  }

  return (
    <div className="h-[450px] w-full rounded-3xl overflow-hidden shadow-card relative border border-primary/20 z-0">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <ChangeView center={center} zoom={13} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapItems.map(item => (
          <Marker 
            key={item.id} 
            position={[item.latitude!, item.longitude!]}
            icon={getCustomIcon(item.urgency)}
          >
            <Popup className="fazaa-popup">
              <div className="text-right font-display p-1" dir="rtl">
                <div className="font-extrabold text-[13px] mb-1">{item.requester_name}</div>
                <div className="text-[11px] mb-2 leading-tight opacity-90">{item.category} · {item.urgency}</div>
                <div className="text-[10px] text-gray-500 mb-3">{formatTimeAgo(item.created_at)}</div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(item);
                  }} 
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2 px-3 text-[11px] font-bold shadow-sm"
                >
                  استجابـة للفزعة
                </button>
                <a 
                  href={buildMapsUrl(item) || "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-secondary text-secondary-foreground rounded-xl py-2 px-3 text-[11px] font-bold mt-1.5 flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  الاتجاهات
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
