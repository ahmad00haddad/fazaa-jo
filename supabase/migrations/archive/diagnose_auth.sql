-- =============================================================
-- 🔍 سكريبت تشخيصي: شغّله في Supabase SQL Editor ليريك حالة النظام
-- =============================================================

-- 1) كم مستخدم عندنا وما عندهم profile؟
SELECT
  'users without profile' AS issue,
  COUNT(*) AS count
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 2) كم مستخدم عندهم profile ناقص (name = "مستخدم" أو phone فاضي)؟
SELECT
  'profiles with placeholder data' AS issue,
  COUNT(*) AS count
FROM public.profiles p
LEFT JOIN public.user_private_data u ON u.user_id = p.id
WHERE p.name = 'مستخدم' OR COALESCE(u.phone, '') = '';

-- 3) هل الدوال المطلوبة موجودة؟
SELECT
  proname AS function_name,
  pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'complete_my_profile',
    'ensure_user_private_data',
    'get_my_phone',
    'handle_new_user_registration',
    'normalize_jordan_phone'
  )
ORDER BY proname;

-- 4) هل الـ trigger شغّال على auth.users؟
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 5) عرض أول 5 مستخدمين وحالة بروفايلاتهم
SELECT
  u.id,
  u.email,
  p.name,
  p.gender,
  upd.phone,
  upd.phone_verified
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_private_data upd ON upd.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 5;
