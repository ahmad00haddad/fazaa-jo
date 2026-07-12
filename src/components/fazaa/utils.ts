export function badgeClass(v: "primary" | "accent" | "secondary") {
  if (v === "primary") return "bg-primary/12 text-primary";
  if (v === "accent") return "bg-accent/12 text-accent";
  return "bg-secondary text-secondary-foreground";
}

export function formatPrice(p: number | null | undefined) {
  const n = Number(p ?? 0);
  if (!n || n <= 0) return "تطوعية (مجاناً)";
  return `${n} د.أ`;
}
