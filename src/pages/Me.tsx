import PageHeader from "@/components/PageHeader";
import { Sparkles, Heart, Shield, Info } from "lucide-react";

export default function Me() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="حسابي" back={false} />
      <div className="p-4">
        <div className="bg-card rounded-2xl p-5 shadow-card text-center">
          <div className="w-20 h-20 mx-auto rounded-full gradient-hero flex items-center justify-center mb-3">
            <Sparkles className="w-9 h-9 text-primary-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg">مرحباً بك في فزعة</h2>
          <p className="text-sm text-muted-foreground mt-1">جميع الخدمات مجانية ومتاحة بدون تسجيل</p>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { icon: Heart, title: "عن فزعة", desc: "تطبيق عربي يجمع المساعدة المجتمعية مع الذكاء الاصطناعي" },
            { icon: Shield, title: "الخصوصية", desc: "لا نجمع بياناتك. كل شيء يبقى على جهازك" },
            { icon: Info, title: "الإصدار", desc: "1.0.0" },
          ].map((it) => (
            <div key={it.title} className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <it.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          صُنع بـ ❤️ للمجتمع العربي والأردني
        </p>
      </div>
    </div>
  );
}
