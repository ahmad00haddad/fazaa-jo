
-- 1) Drop old normalize trigger + phone column with all dependents
DROP TRIGGER IF EXISTS trg_profiles_normalize_phone ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS profiles_normalize_phone_trg ON public.profiles CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_verified CASCADE;

-- 2) New private data table
CREATE TABLE IF NOT EXISTS public.user_private_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL DEFAULT '',
  phone_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_private_data TO authenticated;
GRANT ALL ON public.user_private_data TO service_role;

ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_private_data self select" ON public.user_private_data;
CREATE POLICY "user_private_data self select" ON public.user_private_data
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_private_data self insert" ON public.user_private_data;
CREATE POLICY "user_private_data self insert" ON public.user_private_data
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_private_data self update" ON public.user_private_data;
CREATE POLICY "user_private_data self update" ON public.user_private_data
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) Normalize-phone trigger on new table
CREATE OR REPLACE FUNCTION public.user_private_data_normalize_phone()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.phone := public.normalize_jordan_phone(NEW.phone);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_private_data_normalize_phone_trg ON public.user_private_data;
CREATE TRIGGER user_private_data_normalize_phone_trg
BEFORE INSERT OR UPDATE ON public.user_private_data
FOR EACH ROW EXECUTE FUNCTION public.user_private_data_normalize_phone();

-- 4) Backfill for existing users
INSERT INTO public.user_private_data (user_id, phone)
SELECT id, '' FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 5) Update handle_new_user to seed both tables
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

-- 6) Rebuild phone RPCs against private table
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT phone FROM public.user_private_data WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_responder_phone(_responder_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.phone FROM public.user_private_data d
  WHERE d.user_id = _responder_id
    AND EXISTS (
      SELECT 1 FROM public.fazaa_responses r
      JOIN public.fazaa_requests req ON req.id = r.request_id
      WHERE r.responder_id = _responder_id
        AND req.user_id = auth.uid()
        AND r.accepted = true
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_responder_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_responder_phone(uuid) TO authenticated;

-- 7) accept_response_rpc now sets status = 'in_progress'
CREATE OR REPLACE FUNCTION public.accept_response_rpc(
  p_response_id uuid, p_request_id uuid, p_responder_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fazaa_requests WHERE id = p_request_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.fazaa_responses SET accepted = true WHERE id = p_response_id;
  UPDATE public.fazaa_requests SET status = 'in_progress' WHERE id = p_request_id AND status = 'active';
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (p_responder_id, 'تم قبول استجابتك!', 'تم اختيارك لتقديم الفزعة، انتظر تواصل صاحب الطلب معك', '/history');
END $$;

-- 8) confirm_fazaa_completion — atomic finish + privacy scrub + points guard
CREATE OR REPLACE FUNCTION public.confirm_fazaa_completion(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_status text;
  v_responder uuid;
  v_recent int;
BEGIN
  SELECT user_id, status INTO v_owner, v_status
    FROM public.fazaa_requests WHERE id = p_request_id FOR UPDATE;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'غير مصرح لك'; END IF;
  IF v_status <> 'in_progress' THEN RAISE EXCEPTION 'الفزعة ليست قيد التنفيذ'; END IF;

  SELECT responder_id INTO v_responder FROM public.fazaa_responses
    WHERE request_id = p_request_id AND accepted = true LIMIT 1;

  UPDATE public.fazaa_requests
     SET status = 'completed',
         latitude = NULL,
         longitude = NULL,
         location = 'موقع مخفي للخصوصية'
   WHERE id = p_request_id;

  IF v_responder IS NOT NULL THEN
    SELECT count(*) INTO v_recent
      FROM public.fazaa_responses r
      JOIN public.fazaa_requests q ON q.id = r.request_id
     WHERE r.responder_id = v_responder
       AND q.user_id = v_owner
       AND q.status = 'completed'
       AND q.id <> p_request_id
       AND q.created_at > now() - interval '24 hours';
    IF v_recent = 0 THEN
      UPDATE public.profiles SET points = COALESCE(points,0) + 10 WHERE id = v_responder;
    END IF;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.confirm_fazaa_completion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_fazaa_completion(uuid) TO authenticated;

-- 9) submit_rating RPC
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_request_id uuid, p_responder_id uuid, p_rating int
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'التقييم يجب أن يكون بين 1 و 5';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fazaa_requests
     WHERE id = p_request_id AND user_id = auth.uid() AND status = 'completed'
  ) THEN RAISE EXCEPTION 'لا يمكن التقييم قبل إتمام الفزعة'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fazaa_responses
     WHERE request_id = p_request_id AND responder_id = p_responder_id AND accepted = true
  ) THEN RAISE EXCEPTION 'المستجيب غير معتمد لهذا الطلب'; END IF;

  INSERT INTO public.user_ratings (request_id, rater_id, responder_id, rating)
  VALUES (p_request_id, auth.uid(), p_responder_id, p_rating)
  ON CONFLICT DO NOTHING;
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_rating(uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_rating(uuid, uuid, int) TO authenticated;

-- 10) prevent_gender_change trigger
CREATE OR REPLACE FUNCTION public.prevent_gender_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.gender IS NOT NULL AND OLD.gender <> '' AND NEW.gender IS DISTINCT FROM OLD.gender THEN
    RAISE EXCEPTION 'لا يمكن تغيير الجنس بعد تحديده';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS prevent_gender_change_trg ON public.profiles;
CREATE TRIGGER prevent_gender_change_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_gender_change();

-- 11) lock_request_on_progress trigger
CREATE OR REPLACE FUNCTION public.lock_request_on_progress()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'in_progress' AND NEW.status = 'in_progress' THEN
    IF NEW.price_jod IS DISTINCT FROM OLD.price_jod
       OR NEW.location IS DISTINCT FROM OLD.location
       OR NEW.latitude IS DISTINCT FROM OLD.latitude
       OR NEW.longitude IS DISTINCT FROM OLD.longitude
       OR NEW.need IS DISTINCT FROM OLD.need
       OR NEW.category IS DISTINCT FROM OLD.category THEN
      RAISE EXCEPTION 'لا يمكن تعديل تفاصيل الطلب أثناء التنفيذ';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS lock_request_on_progress_trg ON public.fazaa_requests;
CREATE TRIGGER lock_request_on_progress_trg
BEFORE UPDATE ON public.fazaa_requests
FOR EACH ROW EXECUTE FUNCTION public.lock_request_on_progress();

-- 12) Expiry function updated (24h urgent/critical, 7d normal, 24h stalled in_progress -> expired)
CREATE OR REPLACE FUNCTION public.expire_urgent_fazaa_requests()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.fazaa_requests
     SET status = 'expired'
   WHERE status = 'active'
     AND (
       ((urgency = 'عاجلة اليوم' OR urgency = 'حرجة') AND created_at < now() - interval '24 hours')
       OR (urgency = 'عادية' AND created_at < now() - interval '7 days')
     );
  GET DIAGNOSTICS affected = ROW_COUNT;

  UPDATE public.fazaa_requests
     SET status = 'expired'
   WHERE status = 'in_progress'
     AND created_at < now() - interval '24 hours';

  RETURN affected;
END $$;

-- 13) pg_cron scheduling (every 15 min)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('expire_fazaa_requests_15min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'expire_fazaa_requests_15min',
  '*/15 * * * *',
  $$SELECT public.expire_urgent_fazaa_requests();$$
);
