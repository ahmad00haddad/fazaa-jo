CREATE OR REPLACE FUNCTION public.prevent_gender_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.gender IS NOT NULL
     AND OLD.gender <> NEW.gender
     AND COALESCE(OLD.name, '') NOT IN ('', 'مستخدم', 'مستخدم جديد')
  THEN
    RAISE EXCEPTION 'لا يمكن تغيير الجنس بعد تحديده';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_my_profile(p_name text, p_gender text, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_name text := nullif(btrim(p_name), '');
  v_phone text;
  v_existing_gender text;
  v_existing_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'الاسم مطلوب';
  END IF;

  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'الجنس غير صالح';
  END IF;

  v_phone := public.normalize_jordan_phone(p_phone);

  IF v_phone IS NULL OR v_phone !~ '^9627[789][0-9]{7}$' THEN
    RAISE EXCEPTION 'رقم الهاتف الأردني غير صالح';
  END IF;

  INSERT INTO public.profiles (id, name, gender)
  VALUES (v_uid, v_name, p_gender)
  ON CONFLICT (id) DO NOTHING;

  SELECT gender::text, name
    INTO v_existing_gender, v_existing_name
    FROM public.profiles
    WHERE id = v_uid
    FOR UPDATE;

  IF v_existing_gender IS NOT NULL
     AND v_existing_gender <> p_gender
     AND COALESCE(v_existing_name, '') NOT IN ('', 'مستخدم', 'مستخدم جديد')
  THEN
    RAISE EXCEPTION 'لا يمكن تغيير الجنس بعد تحديده';
  END IF;

  UPDATE public.profiles
     SET name = v_name,
         gender = p_gender,
         updated_at = now()
   WHERE id = v_uid;

  INSERT INTO public.user_private_data (user_id, phone, phone_verified, updated_at)
  VALUES (v_uid, v_phone, true, now())
  ON CONFLICT (user_id) DO UPDATE
  SET phone = EXCLUDED.phone,
      phone_verified = EXCLUDED.phone_verified,
      updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.complete_my_profile(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_my_profile(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.prevent_gender_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prevent_gender_change() TO authenticated, service_role;