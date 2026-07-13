-- ==============================================================================
-- Root Fix Login & Auto-Provisioning (Backfill & Triggers)
-- ==============================================================================

-- 1) تأكيد سياسة قراءة بسيطة للبروفايلات لتجنب أي Subquery Recursion
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 2) Backfill للمستخدمين القدامى الذين لا يملكون صفاً في user_private_data
INSERT INTO public.user_private_data (user_id, phone, phone_verified)
SELECT id, '', false FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_private_data u WHERE u.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- 3) دالة لضمان إنشاء بيانات المستخدم تلقائياً عند التسجيل (Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- أ) إنشاء البروفايل الأساسي
  INSERT INTO public.profiles (id, name, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'مستخدم'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male')
  )
  ON CONFLICT (id) DO NOTHING;

  -- ب) إنشاء سجل البيانات الخاصة (رقم الهاتف)
  INSERT INTO public.user_private_data (user_id, phone, phone_verified)
  VALUES (NEW.id, '', false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;

-- 4) ربط الدالة بـ Trigger على جدول auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 5) تحديث دالة get_my_phone لتكون آمنة ولا تتعطل أبداً
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
BEGIN
  SELECT phone INTO v_phone FROM public.user_private_data WHERE user_id = auth.uid();
  RETURN COALESCE(v_phone, '');
END $$;

REVOKE ALL ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;
