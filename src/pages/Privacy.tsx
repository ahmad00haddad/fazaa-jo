import PageHeader from "@/components/PageHeader";

export default function Privacy() {
  return (
    <div className="min-h-screen pb-28 animate-fade-in bg-background">
      <PageHeader title="سياسة الخصوصية" subtitle="كيف نحمي بياناتك في فزعة" back={true} />
      <div className="p-5 space-y-4 text-sm leading-7 text-foreground/90">
        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-primary mb-2">1. جمع البيانات</h2>
          <p>نقوم بجمع المعلومات الأساسية لضمان عمل تطبيق "فزعة" بأمان، وتشمل: رقم الهاتف الأردني (لغايات التوثيق)، الاسم، الجنس، الموقع التقريبي أثناء استخدام ميزة الخريطة، ومعلومات الجهاز.</p>
        </section>

        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-primary mb-2">2. استخدام البيانات</h2>
          <p>تُستخدم بياناتك لـ:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>توثيق هويتك وبناء الثقة بين المستخدمين.</li>
            <li>عرض الفزعات القريبة منك جغرافياً.</li>
            <li>تحسين تجربة المستخدم وإرسال إشعارات الفزعة.</li>
          </ul>
        </section>

        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-pink-600 mb-2">3. خصوصية الجنسين (ميزة خاصة)</h2>
          <p>نحن نحترم الخصوصية الثقافية للمجتمع الأردني. عند إنشاء فزعة واختيار "للبنات فقط" أو "للشباب فقط"، فإننا نضمن تقنياً (عبر Row Level Security) عدم تسريب هذه الفزعة للجنس الآخر إطلاقاً.</p>
        </section>

        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-primary mb-2">4. مشاركة البيانات</h2>
          <p>نحن لا نبيع بياناتك الشخصية أبداً. يتم مشاركة اسمك وتقييمك فقط مع المستخدمين الآخرين لغايات تقديم الفزعة. رقم هاتفك يبقى مخفياً إلا إذا اخترت أنت مشاركته داخل المحادثة.</p>
        </section>

        <p className="text-center text-muted-foreground mt-8 text-xs">
          آخر تحديث: يوليو 2026<br/>
          بتطبيقك لهذه الشروط، أنت تساهم في جعل الأردن بيئة أفضل للجميع.
        </p>
      </div>
    </div>
  );
}
