CREATE OR REPLACE FUNCTION public.anonymize_on_user_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.fazaa_requests SET requester_name = 'مستخدم محذوف' WHERE user_id = OLD.id;
  UPDATE public.fazaa_responses SET responder_name = 'مستخدم محذوف' WHERE responder_id = OLD.id;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS tr_anonymize_on_user_delete ON auth.users;
CREATE TRIGGER tr_anonymize_on_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.anonymize_on_user_delete();
