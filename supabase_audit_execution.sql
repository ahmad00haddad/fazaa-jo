-- =========================================================================================
-- التنفيذ الشامل لتقرير التدقيق الأمني والمنطقي
-- يجب تنفيذ هذا السكربت بالكامل داخل SQL Editor في لوحة تحكم Supabase.
-- =========================================================================================

-- ==========================================
-- 1) حماية female_only لجدول الاستجابات
-- ==========================================
CREATE OR REPLACE FUNCTION can_respond_to_request(req_id uuid, resp_uid uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req record;
  v_user_gender text;
BEGIN
  SELECT female_only, status INTO v_req FROM public.fazaa_requests WHERE id = req_id;
  IF NOT FOUND OR v_req.status != 'active' THEN
    RETURN false;
  END IF;
  IF NOT v_req.female_only THEN
    RETURN true;
  END IF;
  SELECT gender INTO v_user_gender FROM public.profiles WHERE id = resp_uid;
  RETURN v_user_gender = 'female';
END;
$$;

DROP POLICY IF EXISTS "Users can insert responses for themselves" ON public.fazaa_responses;
CREATE POLICY "Users can insert responses for themselves"
ON public.fazaa_responses FOR INSERT
WITH CHECK (auth.uid() = responder_id AND can_respond_to_request(request_id, auth.uid()));

-- ==========================================
-- 2) إغلاق إدراج الإشعارات العشوائية
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "No direct insert for notifications" ON public.notifications;
CREATE POLICY "No direct insert for notifications"
ON public.notifications FOR INSERT WITH CHECK (false);

CREATE OR REPLACE FUNCTION secure_send_notification(p_user_id uuid, p_title text, p_body text, p_link text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (p_user_id, p_title, p_body, p_link);
END;
$$;

-- ==========================================
-- 3) تأمين قراءة الاستجابات وأماكن المراقبة
-- ==========================================
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Responses viewable by requester and responder" ON public.fazaa_responses;
CREATE POLICY "Responses viewable by requester and responder"
ON public.fazaa_responses FOR SELECT
USING (
  auth.uid() = responder_id
  OR auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = request_id)
);

CREATE OR REPLACE FUNCTION get_response_count(req_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  c integer;
BEGIN
  SELECT count(*) INTO c FROM public.fazaa_responses WHERE request_id = req_id;
  RETURN c;
END;
$$;

DROP POLICY IF EXISTS "Area watch is readable by everyone" ON public.area_watch;
DROP POLICY IF EXISTS "Area watch viewable by city peers" ON public.area_watch;
CREATE POLICY "Area watch viewable by city peers"
ON public.area_watch FOR SELECT
USING (
  city = (SELECT city FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() = user_id
);

-- ==========================================
-- 4) منع تجاوز الحد الأقصى للطلبات النشطة (3)
-- ==========================================
CREATE OR REPLACE FUNCTION check_active_requests_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  active_count integer;
BEGIN
  SELECT count(*) INTO active_count 
  FROM public.fazaa_requests 
  WHERE user_id = NEW.user_id AND status = 'active';

  IF active_count >= 3 THEN
    RAISE EXCEPTION 'لا يمكنك إضافة أكثر من 3 فزعات نشطة في نفس الوقت.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_active_limit ON public.fazaa_requests;
CREATE TRIGGER trigger_check_active_limit
BEFORE INSERT ON public.fazaa_requests
FOR EACH ROW
EXECUTE FUNCTION check_active_requests_limit();

-- ==========================================
-- 5) التزامن في قبول استجابتين لنفس الطلب
-- ==========================================
CREATE OR REPLACE FUNCTION accept_response_atomic(p_response_id uuid, p_request_id uuid, p_responder_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req_status text;
  v_req_owner uuid;
BEGIN
  SELECT status, user_id INTO v_req_status, v_req_owner 
  FROM public.fazaa_requests 
  WHERE id = p_request_id FOR UPDATE;

  IF auth.uid() != v_req_owner THEN
    RAISE EXCEPTION 'غير مصرح لك بقبول هذه الاستجابة.';
  END IF;

  IF v_req_status != 'active' THEN
    RAISE EXCEPTION 'هذا الطلب لم يعد نشطاً.';
  END IF;

  UPDATE public.fazaa_responses SET accepted = true WHERE id = p_response_id;
  -- الملاحظة 8: غيرناها من completed إلى in_progress
  UPDATE public.fazaa_requests SET status = 'in_progress' WHERE id = p_request_id;

  PERFORM secure_send_notification(
    p_responder_id, 
    'تم قبول فزعتك! 🎉', 
    'صاحب الفزعة بانتظارك، اضغط لمعرفة التفاصيل والتوجه للموقع.'
  );

  RETURN true;
END;
$$;

-- ==========================================
-- 6) شارة موثق (الاعتماد على توثيق الهاتف)
-- ==========================================
CREATE OR REPLACE FUNCTION verify_user_profile()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone text;
  v_is_phone_verified boolean;
BEGIN
  SELECT phone INTO v_phone FROM public.profiles WHERE id = auth.uid();
  SELECT verified INTO v_is_phone_verified 
  FROM public.phone_verifications 
  WHERE phone = v_phone ORDER BY created_at DESC LIMIT 1;

  IF v_is_phone_verified = true THEN
    UPDATE public.profiles SET verified = true WHERE id = auth.uid();
    RETURN true;
  ELSE
    RAISE EXCEPTION 'لا يمكن توثيق الحساب قبل تأكيد الهاتف بنجاح.';
  END IF;
END;
$$;

-- ==========================================
-- 7) حماية تأكيد الهاتف من التخمين
-- ==========================================
ALTER TABLE public.phone_verifications ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;

CREATE OR REPLACE FUNCTION verify_phone_code(p_phone text, p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_record record;
BEGIN
  SELECT * INTO v_record 
  FROM public.phone_verifications 
  WHERE phone = p_phone 
    AND created_at > (now() - interval '15 minutes')
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'لا يوجد رمز فعال أو انتهت صلاحيته.';
  END IF;

  IF v_record.attempts >= 5 THEN
    RAISE EXCEPTION 'لقد تجاوزت الحد الأقصى للمحاولات الفاشلة. يرجى طلب رمز جديد بعد 15 دقيقة.';
  END IF;

  IF v_record.code = p_code THEN
    UPDATE public.phone_verifications SET verified = true WHERE id = v_record.id;
    RETURN true;
  ELSE
    UPDATE public.phone_verifications SET attempts = attempts + 1 WHERE id = v_record.id;
    RAISE EXCEPTION 'الرمز غير صحيح.';
  END IF;
END;
$$;

-- ==========================================
-- 8) إنهاء الطلبات (in_progress إلى completed)
-- ==========================================
ALTER TABLE public.fazaa_requests 
  ADD COLUMN IF NOT EXISTS requester_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS responder_confirmed boolean DEFAULT false;

CREATE OR REPLACE FUNCTION confirm_fazaa_completion(p_request_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req record;
  v_responder_id uuid;
BEGIN
  SELECT * INTO v_req FROM public.fazaa_requests WHERE id = p_request_id FOR UPDATE;
  
  IF v_req.status != 'in_progress' THEN
    RAISE EXCEPTION 'لا يمكن التأكيد إلا للطلبات الجارية (in_progress).';
  END IF;

  IF auth.uid() = v_req.user_id THEN
    UPDATE public.fazaa_requests SET requester_confirmed = true WHERE id = p_request_id;
  ELSE
    SELECT responder_id INTO v_responder_id FROM public.fazaa_responses 
    WHERE request_id = p_request_id AND accepted = true;
    
    IF auth.uid() = v_responder_id THEN
      UPDATE public.fazaa_requests SET responder_confirmed = true WHERE id = p_request_id;
    ELSE
      RAISE EXCEPTION 'غير مصرح لك.';
    END IF;
  END IF;

  -- تحديث الحالة محلياً للمتغير
  SELECT * INTO v_req FROM public.fazaa_requests WHERE id = p_request_id;

  IF v_req.requester_confirmed AND v_req.responder_confirmed THEN
    UPDATE public.fazaa_requests SET status = 'completed' WHERE id = p_request_id;
    
    SELECT responder_id INTO v_responder_id FROM public.fazaa_responses WHERE request_id = p_request_id AND accepted = true;
    UPDATE public.profiles SET points = COALESCE(points, 0) + 10 WHERE id = v_responder_id;
  END IF;

  RETURN true;
END;
$$;

-- ==========================================
-- 9) المهام المجدولة (pg_cron)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.fazaa_requests 
  SET status = 'expired' 
  WHERE status = 'active' AND urgency = 'high' AND created_at < now() - interval '24 hours';

  UPDATE public.fazaa_requests 
  SET status = 'expired' 
  WHERE status = 'active' AND urgency = 'normal' AND created_at < now() - interval '7 days';
END;
$$;

-- إلغاء المهمة السابقة لو وجدت وإضافتها
SELECT cron.unschedule('expire-fazaa-hourly');
SELECT cron.schedule('expire-fazaa-hourly', '0 * * * *', 'SELECT expire_old_requests();');

-- ==========================================
-- 10) نظام الحظر والبلاغات
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id uuid REFERENCES public.profiles(id) NOT NULL,
  blocked_id uuid REFERENCES public.profiles(id) NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.profiles(id) NOT NULL,
  reported_id uuid REFERENCES public.profiles(id) NOT NULL,
  request_id uuid REFERENCES public.fazaa_requests(id),
  reason text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION block_user(p_blocked_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.blocked_users (blocker_id, blocked_id, reason)
  VALUES (auth.uid(), p_blocked_id, p_reason)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION report_user(p_reported_id uuid, p_request_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_reports (reporter_id, reported_id, request_id, reason)
  VALUES (auth.uid(), p_reported_id, p_request_id, p_reason);
END;
$$;

DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.fazaa_requests;
DROP POLICY IF EXISTS "Requests viewable by non-blocked users" ON public.fazaa_requests;
CREATE POLICY "Requests viewable by non-blocked users"
ON public.fazaa_requests FOR SELECT
USING (
  NOT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (blocker_id = auth.uid() AND blocked_id = fazaa_requests.user_id)
       OR (blocker_id = fazaa_requests.user_id AND blocked_id = auth.uid())
  )
);
