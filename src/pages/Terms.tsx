import PageHeader from "@/components/PageHeader";

export default function Terms() {
  return (
    <div className="min-h-screen pb-28 animate-fade-in bg-background">
      <PageHeader title="شروط الاستخدام" subtitle="القواعد المجتمعية لفزعة" back={true} />
      <div className="p-5 space-y-4 text-sm leading-7 text-foreground/90">
        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-primary mb-2">1. طبيعة المنصة</h2>
          <p>"فزعة" هي منصة مجتمعية لربط الأشخاص الذين يحتاجون إلى مساعدة عاجلة بالمتطوعين (النشامى) القريبين منهم. المنصة لا تقدم خدمات بشكل مباشر، ولا تتدخل في الاتفاق المالي (عربون الشكر) بين الطرفين.</p>
        </section>

        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-primary mb-2">2. شروط النشر (الفزعة)</h2>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>يجب أن تكون الفزعة قانونية وأخلاقية.</li>
            <li>يُمنع منعاً باتاً استغلال المنصة للإعلانات التجارية أو الخدمات المدفوعة المسبقة.</li>
            <li>يجب توفير معلومات دقيقة عن طبيعة المشكلة والموقع.</li>
          </ul>
        </section>

        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-destructive mb-2">3. إساءة الاستخدام</h2>
          <p>نأخذ الأمان على محمل الجد. أي إساءة للمنصة، كإرسال طلبات وهمية، أو التحرش، أو الاحتيال، سيؤدي إلى حظر الحساب فوراً وقد يتم مشاركة المعلومات مع الجهات المختصة في الأردن إذا لزم الأمر.</p>
        </section>

        <section className="bg-secondary/30 p-4 rounded-3xl">
          <h2 className="font-display font-extrabold text-lg text-primary mb-2">4. إخلاء المسؤولية</h2>
          <p>استخدامك لتطبيق فزعة يكون على مسؤوليتك الشخصية. التطبيق غير مسؤول عن أي ضرر مادي أو معنوي قد يحدث نتيجة التواصل أو اللقاء بين المستخدمين. ننصح دائماً بأخذ الحيطة والحذر والالتزام بآداب التعامل.</p>
        </section>
      </div>
    </div>
  );
}
