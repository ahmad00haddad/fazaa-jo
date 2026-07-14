-- =============================================================
-- 🛠️ إصلاح شامل: شغّله مرة واحدة في Supabase SQL Editor
-- يضمن: (أ) كل مستخدم عنده profile + user_private_data
--        (ب) الـ trigger شغّال لأي مستخدم جديد
--        (ج) الدوال الست المطلوبة كلها موجودة وتعمل
-- =============================================================

-- 1) Backfill profiles لأي مستخدم ناقصه
INSERT INTO public.profiles (id, name, gender)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'مستخدم'),
  COALESCE(u.raw_user_meta_data->>'gender', 'male')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 2) Backfill user_private_data لأي مستخدم ناقصه
INSERT INTO public.user_private_data (user_id, phone, phone_verified)
SELECT id, '', false FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_private_data)
ON CONFLICT (user_id) DO NOTHING;

-- 3) تأكد أن دالة handle_new_user_registration موجودة وتعمل
DROP FUNCTION IF EXISTS public.handle_new_user_registration() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'مستخدم'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_private_data (user_id, phone, phone_verified)
  VALUES (NEW.id, '', false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;

-- 4) تأكد أن الـ trigger مربوط
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 5) تأكد أن ensure_user_private_data موجودة
DROP FUNCTION IF EXISTS public.ensure_user_private_data() CASCADE;
CREATE OR REPLACE FUNCTION public.ensure_user_private_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.profiles (id, name, gender)
  SELECT
    auth.uid(),
    COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'مستخدم'),
    COALESCE(u.raw_user_meta_data->>'gender', 'male')
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_private_data (user_id, phone, phone_verified)
  VALUES (auth.uid(), '', false)
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 6) تأكد أن get_my_phone موجودة
DROP FUNCTION IF EXISTS public.get_my_phone() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_phone text;
BEGIN
  SELECT phone INTO v_phone FROM public.user_private_data WHERE user_id = auth.uid();
  RETURN COALESCE(v_phone, '');
END $$;

-- 7) تأكد أن complete_my_profile موجودة بالـ signature الصحيح (3 args)
--    ⚠️ لازم DROP أولاً لأن CREATE OR REPLACE ما يقدر يغيّر أسماء الـ parameters
DROP FUNCTION IF EXISTS public.complete_my_profile(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.complete_my_profile(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.complete_my_profile(text) CASCADE;
DROP FUNCTION IF EXISTS public.complete_my_profile() CASCADE;
CREATE OR REPLACE FUNCTION public.complete_my_profile(p_name text, p_gender text, p_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'غير مصرح'; END IF;

  INSERT INTO public.profiles (id, name, gender)
  VALUES (v_uid, p_name, p_gender)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, gender = EXCLUDED.gender;

  INSERT INTO public.user_private_data (user_id, phone, phone_verified)
  VALUES (v_uid, public.normalize_jordan_phone(p_phone), true)
  ON CONFLICT (user_id) DO UPDATE
  SET phone = EXCLUDED.phone, phone_verified = EXCLUDED.phone_verified;
END $$;

-- 8) الصلاحيات
REVOKE ALL ON FUNCTION public.ensure_user_private_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_private_data() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_my_profile(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_my_profile(text, text, text) TO authenticated;

-- 9) تأكيد: RLS policies على profiles لا تسبب recursion
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- ✅ رسالة نجاح
DO $$ BEGIN RAISE NOTICE '✅ تم تطبيق كل الإصلاحات بنجاح. جرّب تسجل دخول الحين.'; END $$;
