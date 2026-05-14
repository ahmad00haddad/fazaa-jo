import { useNavigate } from "react-router-dom";
import { SERVICES, SERVICE_CATEGORIES } from "@/lib/services";
import PageHeader from "@/components/PageHeader";

export default function Services() {
  const nav = useNavigate();
  return (
    <div className="animate-fade-in">
      <PageHeader title="جميع الخدمات" subtitle={`${SERVICES.length} خدمة ذكية`} back={false} />
      <div className="p-4 space-y-6">
        {SERVICE_CATEGORIES.map((cat) => {
          const items = SERVICES.filter((s) => s.category === cat);
          return (
            <div key={cat}>
              <h2 className="font-display font-bold text-sm text-muted-foreground mb-2 px-1">{cat}</h2>
              <div className="space-y-2">
                {items.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => nav(`/service/${s.slug}`)}
                    className="w-full bg-card rounded-2xl p-3 shadow-card flex items-center gap-3 text-right active:scale-[0.98] transition-transform"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white flex-shrink-0`}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
