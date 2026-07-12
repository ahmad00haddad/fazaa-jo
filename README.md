# مشروع فزعة - الأردن (Fazaa)

تطبيق ويب تقدمي (PWA) يهدف إلى تقديم منصة للمساعدة المجتمعية السريعة (الفزعة) في الأردن. يتيح للمستخدمين طلب مساعدة عاجلة (مثل تعطل سيارة، احتياج لدواء، توصيلة طارئة) ويتيح للمتطوعين أو مقدمي الخدمات الاستجابة لهذه الطلبات.

## التقنيات المستخدمة

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State & Data Fetching**: React Query
- **Backend & Auth**: Supabase (PostgreSQL, Realtime, Storage, Edge Functions)
- **Routing**: React Router DOM

## متطلبات التشغيل

- [Node.js](https://nodejs.org/) (إصدار 18 فما فوق)
- [npm](https://www.npmjs.com/) أو [Bun](https://bun.sh/)
- حساب وقاعدة بيانات على [Supabase](https://supabase.com/)

## إعداد المشروع محلياً

1. **استنساخ المستودع**
```sh
git clone https://github.com/ahmad00haddad/fazaa-jo.git
cd fazaa-jo
```

2. **تثبيت الحزم (Dependencies)**
```sh
npm install
# أو
bun install
```

3. **إعداد المتغيرات البيئية (Environment Variables)**
قم بنسخ ملف `.env.example` إلى `.env` وضع مفاتيح Supabase الخاصة بك:
```sh
cp .env.example .env
```
افتح ملف `.env` وقم بتعديل القيم التالية لتطابق إعدادات Supabase الخاصة بك:
```env
VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"
VITE_SUPABASE_URL="https://your_supabase_project_id.supabase.co"
```

4. **تشغيل خادم التطوير**
```sh
npm run dev
# أو
bun run dev
```

سيتم تشغيل التطبيق على الرابط: `http://localhost:8080` (أو منفذ آخر إذا كان 8080 مستخدماً).

## إعدادات قاعدة البيانات والأمان (Supabase RLS)

لضمان أمان البيانات (مثل طلبات الإناث الخاصة)، يجب تشغيل سكريبت سياسات الأمان المتوفر في المشروع:
1. اذهب إلى لوحة تحكم Supabase الخاصة بك.
2. انتقل إلى محرر SQL (SQL Editor).
3. انسخ محتوى الملف `supabase_rls_policies.sql` وقم بتشغيله.

## بناء المشروع للإنتاج

لإنشاء النسخة النهائية الجاهزة للنشر:
```sh
npm run build
```
سيتم توليد ملفات الإنتاج في مجلد `dist/`.

## ملاحظات إضافية

- التطبيق مصمم بنمط **Mobile-First** مع أقصى عرض للشاشة `max-w-[480px]`.
- توجد سياسات للتحقق من أرقام الهواتف الأردنية (`isValidJordanPhone`).
