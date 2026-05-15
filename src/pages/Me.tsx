import PageHeader from "@/components/PageHeader";
import { HeartHandshake, Info, Phone, ShieldCheck } from "lucide-react";

const cards = [
  {
    icon: HeartHandshake,
    title: "فكرة فزعة",
    desc: "منصة عملية للمساعدة الفورية بين الناس في المواقف المستعجلة مثل تعطل المركبة، الدواء، والمشاوير.",
  },
  {
    icon: Phone,
    title: "التواصل المباشر",
    desc: "الاستجابة تتم مباشرة عبر الاتصال أو واتساب أو الموقع بدون خطوات معقدة أو شاشات تسويقية.",
  },
  {
    icon: ShieldCheck,
    title: "الاستخدام العملي",
    desc: "التركيز هنا على سرعة الوصول للحاجة ونشر الطلب واختيار أسرع وسيلة مساعدة.",
  },
  {
    icon: Info,
    title: "الحالة الحالية",
    desc: "هذه نسخة تشغيلية أولية مركزة على جوهر التطبيق قبل إضافة الحسابات والتخزين السحابي لاحقاً.",
  },
];

export default function Me() {
  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="عن فزعة" back={false} />
      <div className="p-4 space-y-3">
        {cards.map((card) => (
          <section key={card.title} className="rounded-3xl bg-card shadow-card p-4 flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold">{card.title}</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-6">{card.desc}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
