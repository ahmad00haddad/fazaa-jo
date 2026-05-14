import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Phone, MessageCircle, MapPin, Trash2, X, Send } from "lucide-react";
import { toast } from "sonner";

interface FazaaItem {
  id: string;
  name: string;
  phone?: string;
  need: string;
  location?: string;
  createdAt: number;
  mine?: boolean;
}

const STORAGE_KEY = "fazaa_local_feed";

const seed: FazaaItem[] = [
  { id: "s1", name: "أحمد", need: "تعطلت سيارتي على شارع المطار، أحتاج شخص لمساعدتي أو ونش", location: "عمّان - شارع المطار", phone: "0791234567", createdAt: Date.now() - 1000 * 60 * 5 },
  { id: "s2", name: "سارة", need: "أحتاج دواء عاجل من صيدلية مفتوحة في الزرقاء", location: "الزرقاء - دوار الشهداء", phone: "0789876543", createdAt: Date.now() - 1000 * 60 * 18 },
  { id: "s3", name: "عمر", need: "محتاج آلة حاسبة علمية لامتحان بكرا الصبح", location: "إربد - شارع الجامعة", createdAt: Date.now() - 1000 * 60 * 35 },
];

function timeAgo(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.floor(h / 24)} يوم`;
}

export default function Fazaa() {
  const [items, setItems] = useState<FazaaItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const local: FazaaItem[] = stored ? JSON.parse(stored) : [];
      setItems([...local, ...seed]);
    } catch {
      setItems(seed);
    }
  }, []);

  const saveLocal = (mine: FazaaItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mine));
  };

  const addItem = (data: Omit<FazaaItem, "id" | "createdAt" | "mine">) => {
    const item: FazaaItem = { ...data, id: crypto.randomUUID(), createdAt: Date.now(), mine: true };
    const newItems = [item, ...items];
    setItems(newItems);
    saveLocal(newItems.filter((i) => i.mine));
    setShowAdd(false);
    toast.success("تم نشر طلب الفزعة");
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    setItems(newItems);
    saveLocal(newItems.filter((i) => i.mine));
    toast.success("تم الحذف");
  };

  return (
    <div className="animate-fade-in min-h-screen relative">
      <PageHeader title="فزعة المجتمع" subtitle="اطلب أو ساعد من حولك" back={false} />

      <div className="p-4 space-y-3 pb-32">
        {items.map((item) => (
          <FazaaCard key={item.id} item={item} onDelete={deleteItem} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            لا توجد طلبات حالياً. كن أول من يطلب أو يساعد!
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-[480px] w-[calc(100%-2rem)] mx-auto"
        style={{ maxWidth: "calc(480px - 2rem)" }}
      >
        <div className="gradient-hero text-primary-foreground rounded-full py-3.5 px-6 font-display font-bold flex items-center justify-center gap-2 shadow-elevated active:scale-95 transition-transform">
          <Plus className="w-5 h-5" />
          اطلب فزعة
        </div>
      </button>

      {showAdd && <AddSheet onClose={() => setShowAdd(false)} onAdd={addItem} />}
    </div>
  );
}

function FazaaCard({ item, onDelete }: { item: FazaaItem; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState<"none" | "right" | "left">("none");

  const openMap = () => {
    if (!item.location) return toast.error("لا يوجد موقع");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`, "_blank");
  };

  const call = () => {
    if (!item.phone) return toast.error("لا يوجد رقم");
    window.location.href = `tel:${item.phone}`;
  };

  const chat = () => {
    if (!item.phone) return toast.error("لا يوجد رقم");
    const num = item.phone.replace(/\D/g, "").replace(/^0/, "962");
    window.open(`https://wa.me/${num}`, "_blank");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="p-3 flex gap-3">
        <div className="w-11 h-11 rounded-full gradient-hero text-primary-foreground flex items-center justify-center flex-shrink-0 font-display font-bold">
          {item.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display font-bold text-sm">{item.name}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed mt-0.5">{item.need}</p>
          {item.location && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            {item.phone && (
              <>
                <button onClick={call} className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1.5 active:scale-95 transition">
                  <Phone className="w-3 h-3" /> اتصال
                </button>
                <button onClick={chat} className="flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-3 py-1.5 active:scale-95 transition">
                  <MessageCircle className="w-3 h-3" /> واتساب
                </button>
              </>
            )}
            {item.location && (
              <button onClick={openMap} className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-3 py-1.5 active:scale-95 transition">
                <MapPin className="w-3 h-3" /> الموقع
              </button>
            )}
            {item.mine && (
              <button onClick={() => onDelete(item.id)} className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive rounded-full px-3 py-1.5 active:scale-95 transition mr-auto">
                <Trash2 className="w-3 h-3" /> حذف
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (d: Omit<FazaaItem, "id" | "createdAt" | "mine">) => void }) {
  const [name, setName] = useState("");
  const [need, setNeed] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !need.trim()) return toast.error("الاسم والوصف مطلوبان");
    onAdd({ name: name.trim(), need: need.trim(), phone: phone.trim() || undefined, location: location.trim() || undefined });
  };

  const useGeo = () => {
    if (!navigator.geolocation) return toast.error("الموقع غير مدعوم");
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => toast.error("تعذّر الحصول على الموقع")
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-card rounded-t-3xl p-5 safe-bottom animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">اطلب فزعة</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="اسمك *"
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={need} onChange={(e) => setNeed(e.target.value)}
            rows={3} placeholder="ماذا تحتاج؟ *"
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <input
            value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف (اختياري)" type="tel"
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <input
              value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="الموقع (اختياري)"
              className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="button" onClick={useGeo} className="bg-secondary rounded-xl px-3 text-xs font-display font-bold flex items-center gap-1">
              <MapPin className="w-4 h-4" /> الآن
            </button>
          </div>
          <button type="submit" className="w-full gradient-hero text-primary-foreground rounded-2xl py-3 font-display font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition">
            <Send className="w-4 h-4" /> نشر الفزعة
          </button>
        </form>
      </div>
    </div>
  );
}
