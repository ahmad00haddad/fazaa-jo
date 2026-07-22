-- المرحلة 2: تعزيز المنطق التشغيلي (Structural Logic Hardening)

-- 1. تأمين رفع الصور (Avatars) في Supabase Storage
-- تفعيل RLS على جدول التخزين إذا لم يكن مفعلًا
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الصور (Public Read)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- منع المستخدمين من رفع الصور في مجلدات لا تخصهم (عبر التحقق من اسم المجلد المطابق للـ uid)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- تحديث الصور مسموح فقط لنفس المستخدم
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 2. تأمين كشف رقم هاتف المتطوع (Phone Number Leak Fix)
-- يجب ألا يتمكن أي شخص من سحب رقم الفزّيع إلا إذا كان صاحب الطلب وقبل عرض الفزّيع!
CREATE OR REPLACE FUNCTION get_responder_phone(_responder_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone text;
  v_is_authorized boolean;
BEGIN
  -- التحقق من الصلاحية: هل المستخدم الحالي هو المتطوع نفسه؟ أو هل هو صاحب فزعة تم قبول هذا المتطوع فيها؟
  IF auth.uid() = _responder_id THEN
    v_is_authorized := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.fazaa_responses r
      JOIN public.fazaa_requests q ON q.id = r.request_id
      WHERE r.responder_id = _responder_id
        AND q.user_id = auth.uid()
        AND r.accepted = true
    ) INTO v_is_authorized;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'غير مصرح لك برؤية رقم الهاتف';
  END IF;

  SELECT phone INTO v_phone FROM public.profiles WHERE id = _responder_id;
  RETURN v_phone;
END;
$$;
