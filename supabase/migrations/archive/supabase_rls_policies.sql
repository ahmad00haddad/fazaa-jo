-- سكريبت أمان لسياسات (Row Level Security - RLS) في Supabase
-- هذا السكريبت يمنع وصول طلبات "للبنات فقط" للمستخدمين الذكور على مستوى قاعدة البيانات
-- بدلاً من الاعتماد على إخفائها في الواجهة الأمامية فقط.

-- 1. التأكد من تفعيل RLS على الجدول
ALTER TABLE public.fazaa_requests ENABLE ROW LEVEL SECURITY;

-- 2. حذف سياسة القراءة العامة إن وجدت (استبدل 'Enable read access for all users' باسم السياسة الحقيقية إذا كان مختلفاً)
-- DROP POLICY IF EXISTS "Enable read access for all users" ON public.fazaa_requests;

-- 3. إضافة سياسة القراءة الجديدة المحمية
CREATE POLICY "Protected read access for fazaa_requests" 
ON public.fazaa_requests
FOR SELECT 
USING (
  -- يُسمح برؤية الطلب إذا لم يكن مخصصاً للبنات فقط
  female_only = false 
  -- أو إذا كان المستخدم هو من قام بإنشاء الطلب (صاحب الطلب يرى طلبه دائماً)
  OR user_id = auth.uid() 
  -- أو إذا كان مخصصاً للبنات، يجب أن يكون جنس المستخدم الحالي 'female' في جدول profiles
  OR (
    female_only = true 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.gender = 'female'
    )
  )
);
