import { useState } from "react";
import { Star, Loader2, X } from "lucide-react";

export function RatingModal({
  isOpen,
  responderName,
  onSubmit,
  onClose,
  loading
}: {
  isOpen: boolean;
  responderName: string;
  onSubmit: (rating: number) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [rating, setRating] = useState(5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card shadow-elevated rounded-3xl p-6 w-full max-w-sm relative border border-primary/20">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="font-display font-bold text-lg text-center mb-2 mt-2">تقييم الفزعة</h2>
        <p className="text-sm text-muted-foreground text-center mb-6 px-4 leading-6">
          الفزعة تمت بنجاح! كيف تقيم مساعدتك من قبل <strong>{responderName}</strong>؟
        </p>

        <div className="flex justify-center gap-1.5 mb-8" dir="ltr">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`p-2 transition-transform active:scale-90 ${star <= rating ? 'text-amber-400 drop-shadow-sm' : 'text-secondary drop-shadow-none'}`}
            >
              <Star className="w-9 h-9 fill-current" />
            </button>
          ))}
        </div>

        <button
          onClick={() => onSubmit(rating)}
          disabled={loading}
          className="w-full rounded-2xl gradient-hero text-primary-foreground py-3.5 font-bold flex items-center justify-center shadow-md active:scale-[0.98] transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إرسال وإغلاق الفزعة"}
        </button>
        <button
          onClick={() => onSubmit(0)} // 0 means skip rating but close request
          disabled={loading}
          className="w-full rounded-2xl text-muted-foreground py-3 font-semibold mt-2 active:scale-[0.98] transition-transform text-sm"
        >
          تخطي التقييم وإغلاق الفزعة
        </button>
      </div>
    </div>
  );
}
