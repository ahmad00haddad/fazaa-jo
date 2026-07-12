-- ============================================================
-- الجزء الأول: Backfill فوري + إصلاح handle_new_user + دالة ensure_user_private_data
-- ============================================================

-- 1) Backfill فوري لكل المستخدمين الحاليين الذين ينقصهم سجل user_private_data
INSERT INTO public.user_private_data (user_id, phone)
SELECT id, '' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_private_data)
ON CONFLICT (user_id) DO NOTHING;

-- 2) إصلاح handle_new_user لضمان عدم تكرار المشكلة مستقبلاً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'مستخدم'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_private_data (user_id, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'phone', ''))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;

-- 3) دالة صيانة يستدعيها التطبيق دفاعياً عند كل تسجيل دخول
CREATE OR REPLACE FUNCTION public.ensure_user_private_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.user_private_data (user_id, phone)
  VALUES (auth.uid(), '')
  ON CONFLICT (user_id) DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION public.ensure_user_private_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_private_data() TO authenticated;
