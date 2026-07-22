-- =========================================================================================
-- سكربت زرع بيانات تجريبية (Seed Data) لتطبيق "فزعة"
-- يُرجى تشغيل هذا السكربت في Supabase SQL Editor الخاص بك.
-- يضيف السكربت مستخدمين وهميين وطلبات فزعة واقعية موزعة على مدن الأردن بأفكار منطقية.
-- =========================================================================================

-- تفعيل امتداد التشفير لإنشاء كلمات مرور للمستخدمين الوهميين
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  user1_id uuid := '11111111-1111-1111-1111-111111111111';
  user2_id uuid := '22222222-2222-2222-2222-222222222222';
  user3_id uuid := '33333333-3333-3333-3333-333333333333';
  user4_id uuid := '44444444-4444-4444-4444-444444444444';
  user5_id uuid := '55555555-5555-5555-5555-555555555555';
BEGIN

  -- 1) إدراج حسابات وهمية في جدول auth.users (حتى تعمل الصلاحيات بشكل صحيح)
  -- ملاحظة: كلمة المرور للجميع هي 'password123'
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ahmad@fazaa.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "أحمد الكركي"}', now(), now()),
    (user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sara@fazaa.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "سارة عمّان"}', now(), now()),
    (user3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'khaled@fazaa.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "خالد الإربداوي"}', now(), now()),
    (user4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nour@fazaa.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "نور العقبة"}', now(), now()),
    (user5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'omar@fazaa.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "عمر الزرقاء"}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- 2) تحديث جداول الملفات الشخصية (profiles) الخاصة بهم لتكتمل بيانتهم
  INSERT INTO public.profiles (id, name, gender, phone, city, points, verified, avatar_url)
  VALUES
    (user1_id, 'أحمد الكركي', 'male', '+962791111111', 'الكرك', 150, true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'),
    (user2_id, 'سارة عمّان', 'female', '+962792222222', 'عمّان', 80, true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara'),
    (user3_id, 'خالد الإربداوي', 'male', '+962793333333', 'إربد', 200, true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khaled'),
    (user4_id, 'نور العقبة', 'female', '+962794444444', 'العقبة', 45, false, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nour'),
    (user5_id, 'عمر الزرقاء', 'male', '+962795555555', 'الزرقاء', 300, true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar')
  ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name, city = EXCLUDED.city, points = EXCLUDED.points;

  -- 3) إدراج الفزعات (الطلبات) بمنطقية عالية حسب المدينة والفكرة
  -- لتجنب مشاكل المعرفات، نستخدم ON CONFLICT للطلب الأول كمثال، ولكن للإدراج العشوائي سنمسح الطلبات الوهمية القديمة إن وجدت
  DELETE FROM public.fazaa_requests WHERE user_id IN (user1_id, user2_id, user3_id, user4_id, user5_id);

  INSERT INTO public.fazaa_requests 
    (id, user_id, requester_name, requester_gender, category, urgency, need, city, location, latitude, longitude, female_only, price_jod, status, created_at)
  VALUES
    -- الفزعة 1: تعطل سيارة لامرأة في عمان (مخصصة للإناث)
    (gen_random_uuid(), user2_id, 'سارة عمّان', 'female', 'تعطل مركبة', 'حرجة', 'بنشري في شارع مكة والسيارة وقفت بالشارع الرئيسي. محتاجة مساعدة بتغيير العجل بأسرع وقت (السبير موجود).', 'عمّان', 'شارع مكة', 31.9754, 35.8491, true, 0, 'active', now() - interval '1 hour'),

    -- الفزعة 2: دواء مستعجل لرجل مسن في إربد
    (gen_random_uuid(), user3_id, 'خالد الإربداوي', 'male', 'دواء عاجل', 'عاجلة اليوم', 'محتاج دواء ضغط ضروري (أملور) من صيدلية مناوبة، الصيدليات القريبة مسكرة ومش قادر أطلع حالياً. بعطي ثمن الدواء + 3 دنانير توصيل.', 'إربد', 'شارع الجامعة', 32.5353, 35.8573, false, 3, 'active', now() - interval '3 hours'),

    -- الفزعة 3: مواصلات مطار من الزرقاء
    (gen_random_uuid(), user5_id, 'عمر الزرقاء', 'male', 'توصيل من/إلى المطار', 'عادية', 'عندي طيارة الفجر الساعة 4 وما لقيت مواصلات من الزرقاء لمطار الملكة علياء. بدفع 15 دينار كاش للي بقدر يوصلني.', 'الزرقاء', 'الزرقاء الجديدة', 32.0736, 36.0798, false, 15, 'active', now() - interval '5 hours'),

    -- الفزعة 4: طوارئ منزلية في السلط
    (gen_random_uuid(), user1_id, 'أحمد الكركي', 'male', 'طوارئ منزل', 'حرجة', 'مواسير المي انكسرت والمطبخ غرق بشكل كامل. محتاج سباك ضروري أو أي حد قريب معاه عِدة يقدر يسكر المحبس الرئيسي.', 'السلط', 'وسط البلد - السلط', 32.0360, 35.7340, false, 5, 'active', now() - interval '30 minutes'),

    -- الفزعة 5: مشتريات ضرورية في العقبة
    (gen_random_uuid(), user4_id, 'نور العقبة', 'female', 'مشتريات ضرورية', 'عاجلة اليوم', 'محتاجة جرة غاز للبيت، الجرة خلصت بنص الطبخ وما في سيارة غاز قريبة. بدفع ثمن الجرة مع التوصيل.', 'العقبة', 'المنطقة السكنية الثامنة', 29.5319, 35.0061, false, 2, 'active', now() - interval '2 hours'),

    -- الفزعة 6: فزعة جامعية في المفرق (مغلقة وتمت بنجاح لغايات التيست)
    (gen_random_uuid(), user5_id, 'عمر الزرقاء', 'male', 'فزعة جامعية', 'عادية', 'نسيت دوسية مهمة جداً لامتحان بكرة بمكتبة جامعة آل البيت، في حد هناك بقدر يصورلي أول 5 صفحات؟', 'المفرق', 'جامعة آل البيت', 32.3482, 36.2307, false, 0, 'completed', now() - interval '2 days');

END $$;
