CREATE OR REPLACE FUNCTION public.complete_my_profile(p_name text, p_gender text, p_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN 
    RAISE EXCEPTION 'غير مصرح'; 
  END IF;

  -- تحديث أو إدخال الملف الشخصي العام
  INSERT INTO public.profiles (id, name, gender)
  VALUES (v_uid, p_name, p_gender)
  ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name, 
      gender = EXCLUDED.gender;

  -- تحديث أو إدخال البيانات الخاصة (رقم الهاتف)
  INSERT INTO public.user_private_data (user_id, phone, phone_verified)
  VALUES (v_uid, public.normalize_jordan_phone(p_phone), true)
  ON CONFLICT (user_id) DO UPDATE 
  SET phone = EXCLUDED.phone, 
      phone_verified = EXCLUDED.phone_verified;
      
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_my_profile(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_my_profile(text, text, text) TO authenticated;
