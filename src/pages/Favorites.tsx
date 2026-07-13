import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartOff, User2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";

interface FavoriteProfile {
  id: string;
  favorite_user_id: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
    points: number;
    verified: boolean;
    avatar_url: string | null;
  } | null;
}

export default function Favorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id, favorite_user_id, created_at, profiles!favorites_favorite_user_id_fkey(id, name, points, verified, avatar_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as FavoriteProfile[];
    },
    enabled: !!user?.id,
  });

  const removeMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("تمت الإزالة من المفضلين");
    },
    onError: () => toast.error("تعذّر الحذف، حاول مرة أخرى"),
  });

  return (
    <div className="pb-28">
      <PageHeader title="أصدقاء الفزعة" subtitle="الأشخاص الذين تثق بهم" back />

      <div className="px-4 pt-2 space-y-3">
        {/* Info banner */}
        <div className="rounded-2xl bg-primary/8 border border-primary/15 px-4 py-3 text-xs text-primary/80 leading-5">
          <span className="font-bold">💡 نصيحة:</span> أضف الأشخاص الذين ساعدوك سابقاً هنا لتتمكن من الوصول إليهم بسرعة عند الحاجة.
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card shadow-card p-4 animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded-full bg-muted" />
                  <div className="h-3 w-16 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-card shadow-card p-10 text-center flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
              <HeartOff className="w-7 h-7 text-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground">لم تُضف أي شخص للمفضلين بعد.</p>
            <p className="text-xs text-muted-foreground/70">بعد إتمام فزعة مع شخص ما، يمكنك إضافته هنا.</p>
          </motion.div>
        )}

        {/* Favorites list */}
        <AnimatePresence>
          {favorites.map((fav, i) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-card shadow-card p-4 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {fav.profiles?.avatar_url ? (
                  <img src={fav.profiles.avatar_url} alt={fav.profiles.name} className="w-full h-full object-cover" />
                ) : (
                  <User2 className="w-6 h-6 text-primary/50" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm truncate">{fav.profiles?.name ?? "مستخدم"}</span>
                  {fav.profiles?.verified && (
                    <Star className="w-3.5 h-3.5 text-accent shrink-0 fill-accent" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {fav.profiles?.points ?? 0} نقطة فزعة
                </div>
              </div>

              {/* Remove button */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => removeMutation.mutate(fav.id)}
                disabled={removeMutation.isPending}
                className="w-9 h-9 rounded-xl bg-destructive/8 text-destructive flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="إزالة من المفضلين"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
