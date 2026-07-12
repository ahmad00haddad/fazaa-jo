import { useState, useEffect } from "react";
import { Loader2, User as UserIcon, Phone, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (open && profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
    }
  }, [open, profile]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (name.trim().length < 2) return toast.error("الاسم قصير جداً");
    if (!phone.startsWith("07") || phone.length !== 10) return toast.error("رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 07");

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), city: city.trim() })
      .eq("id", user.id);

    let phoneErr: any = null;
    if (!error) {
      const res = await (supabase as any)
        .from("user_private_data")
        .upsert({ user_id: user.id, phone: phone.trim() }, { onConflict: "user_id" });
      phoneErr = res.error;
    }

    setLoading(false);

    if (error || phoneErr) {
      toast.error("حدث خطأ أثناء التحديث");
      return;
    }

    toast.success("تم تحديث حسابك بنجاح");
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
          <h2 className="font-display font-bold text-lg">تعديل الحساب</h2>
          <button 
            type="button" 
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" /> الاسم
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl bg-secondary border-none px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="اسمك الكامل"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> رقم الهاتف
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-2xl bg-secondary border-none px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="07XXXXXXXX"
              dir="ltr"
              maxLength={10}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> المدينة
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl bg-secondary border-none px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none"
              required
            >
              <option value="" disabled>اختر المدينة</option>
              <option value="عمان">عمان</option>
              <option value="إربد">إربد</option>
              <option value="الزرقاء">الزرقاء</option>
              <option value="المفرق">المفرق</option>
              <option value="عجلون">عجلون</option>
              <option value="جرش">جرش</option>
              <option value="البلقاء">البلقاء</option>
              <option value="مادبا">مادبا</option>
              <option value="الكرك">الكرك</option>
              <option value="الطفيلة">الطفيلة</option>
              <option value="معان">معان</option>
              <option value="العقبة">العقبة</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-6 transition-transform active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </form>
      </div>
    </div>
  );
}
