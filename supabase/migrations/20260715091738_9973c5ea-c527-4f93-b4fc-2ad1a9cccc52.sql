CREATE OR REPLACE FUNCTION public.prevent_gender_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE ALL ON FUNCTION public.prevent_gender_change() FROM PUBLIC, anon, authenticated;