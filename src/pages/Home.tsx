import { useNavigate } from "react-router-dom";
import { SERVICES, SERVICE_CATEGORIES } from "@/lib/services";
import { Sparkles, MessageCircle, Users, Search } from "lucide-react";
import { useState, useMemo } from "react";

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim();
    if (!t) return SERVICES;
    return SERVICES.filter((s) => s.title.includes(t) || s.desc.includes(t) || s.category.includes(t));
  }, [q]);

  const featured = [
    { to: "/chat", icon: MessageCircle, title: "المساعد الذكي", desc: "اسأل أي شيء", color: "from-violet-600 to-purple-600" },
    { to: "/fazaa", icon: Users, title: "فزعة المجتمع", desc: "اطلب أو قدّم مساعدة", color: "from-emerald-600 to-teal-600" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 safe-top gradient-hero text-primary-foreground rounded-b-3xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl">فزعة</h1>
            <p className="text-sm opacity-90">خدمات ذكية مجانية بين يديك</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن خدمة..."
            className="w-full bg-white text-foreground rounded-2xl pr-10 pl-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {/* Featured */}
      <section className="px-4 mt-5">
        <div className="grid grid-cols-2 gap-3">
          {featured.map((f) => (
            <button
              key={f.to}
              onClick={() => nav(f.to)}
              className={`bg-gradient-to-br ${f.color} text-white rounded-2xl p-4 text-right shadow-card active:scale-95 transition-transform`}
            >
              <f.icon className="w-6 h-6 mb-2" />
              <div className="font-display font-bold">{f.title}</div>
              <div className="text-xs opacity-90 mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Services by category */}
      <section className="px-4 mt-6">
        {q ? (
          <ServiceGrid services={filtered} onClick={(slug) => nav(`/service/${slug}`)} />
        ) : (
          SERVICE_CATEGORIES.map((cat) => {
            const items = SERVICES.filter((s) => s.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="mb-6">
                <h2 className="font-display font-bold text-base mb-3 px-1">{cat}</h2>
                <ServiceGrid services={items} onClick={(slug) => nav(`/service/${slug}`)} />
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function ServiceGrid({ services, onClick }: { services: typeof SERVICES; onClick: (slug: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {services.map((s) => (
        <button
          key={s.slug}
          onClick={() => onClick(s.slug)}
          className="bg-card rounded-2xl p-3 text-center shadow-card hover:shadow-elevated active:scale-95 transition-all flex flex-col items-center gap-2"
        >
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
            <s.icon className="w-6 h-6" />
          </div>
          <div className="text-xs font-display font-semibold leading-tight">{s.title}</div>
        </button>
      ))}
    </div>
  );
}
