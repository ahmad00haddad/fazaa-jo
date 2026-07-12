import { ShieldCheck, Coins, Heart } from "lucide-react";
import { FazaaRequest } from "@/lib/fazaa";
import { formatPrice } from "./utils";

export function MetaBadges({ item }: { item: FazaaRequest }) {
  const price = Number(item.price_jod ?? 0);
  return (
    <>
      {item.requester_verified && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[11px] font-semibold">
          <ShieldCheck className="w-3 h-3" /> موثّق
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
          price > 0 ? "bg-accent/15 text-accent" : "bg-emerald-500/15 text-emerald-700"
        }`}
      >
        <Coins className="w-3 h-3" />
        {formatPrice(price)}
      </span>
      {item.female_only && (
        <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 text-pink-600 px-2 py-1 text-[11px] font-semibold">
          <Heart className="w-3 h-3" /> للبنات فقط
        </span>
      )}
      {item.city && (
        <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{item.city}</span>
      )}
    </>
  );
}
