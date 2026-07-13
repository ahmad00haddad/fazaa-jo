-- =============================================================
-- إصلاح جذري: ضمان وجود profiles لكل مستخدم مسجّل في auth.users
-- =============================================================

-- 1. Backfill: أنشئ profiles لكل من ليس لديه واحد
INSERT INTO public.profiles (id, name, gender)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'مستخدم'),
  COALESCE(u.raw_user_meta_data->>'gender', 'male')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill: أنشئ user_private_data لكل من ليس لديه سجل
INSERT INTO public.user_private_data (user_id, phone)
SELECT id, COALESCE(raw_user_meta_data->>'phone', '')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_private_data)
ON CONFLICT (user_id) DO NOTHING;

-- 3. تأكد أن ensure_user_private_data موجودة وتعمل
CREATE OR REPLACE FUNCTION public.ensure_user_private_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  -- أنشئ profile إذا لم يكن موجوداً
  INSERT INTO public.profiles (id, name, gender)
  SELECT
    auth.uid(),
    COALESCE(u.raw_user_meta_data->>'name', u.email, 'مستخدم'),
    COALESCE(u.raw_user_meta_data->>'gender', 'male')
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (id) DO NOTHING;

  -- أنشئ user_private_data إذا لم يكن موجوداً
  INSERT INTO public.user_private_data (user_id, phone)
  SELECT
    auth.uid(),
    COALESCE(u.raw_user_meta_data->>'phone', '')
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 4. الصلاحيات
REVOKE ALL ON FUNCTION public.ensure_user_private_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_private_data() TO authenticated, service_role;
