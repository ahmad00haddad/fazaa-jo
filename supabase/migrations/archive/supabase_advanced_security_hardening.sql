-- ============================================================
-- supabase_advanced_security_hardening.sql
-- تأمين طبقة البيانات: عزل الهاتف، تثبيت الجنس، القيود،
-- RPC التقييم، RPC الإتمام، منع تعديل الطُعم، مسح الموقع،
-- الإغلاق التلقائي، التجهيل عند الحذف.
-- ============================================================

-- ---------- (1) عزل رقم الهاتف في جدول محمي ----------
CREATE TABLE IF NOT EXISTS public.user_private_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  phone_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own private data" ON public.user_private_data;
CREATE POLICY "users read own private data"
  ON public.user_private_data FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users update own private data" ON public.user_private_data;
CREATE POLICY "users update own private data"
  ON public.user_private_data FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users insert own private data" ON public.user_private_data;
CREATE POLICY "users insert own private data"
  ON public.user_private_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- نقل أي بيانات هاتف موجودة في profiles ثم حذف العمود
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='profiles' AND column_name='phone') THEN
    INSERT INTO public.user_private_data (user_id, phone)
    SELECT id, phone FROM public.profiles WHERE phone IS NOT NULL
    ON CONFLICT (user_id) DO NOTHING;
    
    -- حذف التريجر القديم المرتبط بالعمود قبل حذفه
    DROP TRIGGER IF EXISTS trg_profiles_normalize_phone ON public.profiles CASCADE;
    
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone CASCADE;
  END IF;
END $$;

-- نقل وظيفة التريجر للجدول الجديد
CREATE OR REPLACE FUNCTION public.user_private_data_normalize_phone_trg()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.phone := public.normalize_jordan_phone(NEW.phone);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_user_private_data_normalize_phone ON public.user_private_data;
CREATE TRIGGER trg_user_private_data_normalize_phone
BEFORE INSERT OR UPDATE OF phone ON public.user_private_data
FOR EACH ROW EXECUTE FUNCTION public.user_private_data_normalize_phone_trg();

-- دوال RPC: لا يُكشف الهاتف إلا بوجود استجابة مقبولة مملوكة للمستدعي
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT phone FROM public.user_private_data WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_responder_phone(_responder_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_phone text;
BEGIN
  SELECT upd.phone INTO v_phone
  FROM public.user_private_data upd
  WHERE upd.user_id = _responder_id
    AND EXISTS (
      SELECT 1 FROM public.fazaa_responses r
      JOIN public.fazaa_requests f ON f.id = r.request_id
      WHERE r.responder_id = _responder_id
        AND f.user_id = auth.uid()
        AND r.accepted = true
    );
  RETURN v_phone;
END;
$$;

-- ---------- (2) تثبيت الجنس بعد أول إدخال ----------
CREATE OR REPLACE FUNCTION public.prevent_gender_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.gender IS NOT NULL AND NEW.gender IS DISTINCT FROM OLD.gender THEN
    RAISE EXCEPTION 'لا يمكن تغيير الجنس بعد تحديده. تواصل مع الدعم الفني.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_prevent_gender_change ON public.profiles;
CREATE TRIGGER tr_prevent_gender_change
  BEFORE UPDATE OF gender ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_gender_change();

-- ---------- (6,7) قيود الإحداثيات والسعر ----------
ALTER TABLE public.fazaa_requests DROP CONSTRAINT IF EXISTS chk_jordan_bounds;
ALTER TABLE public.fazaa_requests
  ADD CONSTRAINT chk_jordan_bounds CHECK (
    latitude IS NULL OR
    (latitude BETWEEN 29.0 AND 33.5 AND longitude BETWEEN 34.5 AND 39.5)
  );

ALTER TABLE public.fazaa_requests DROP CONSTRAINT IF EXISTS chk_realistic_price;
ALTER TABLE public.fazaa_requests
  ADD CONSTRAINT chk_realistic_price CHECK (price_jod >= 0 AND price_jod <= 1000);

-- ---------- (8) RPC التقييم الآمن ----------
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_request_id uuid, p_responder_id uuid, p_rating int
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'التقييم يجب أن يكون بين 1 و 5';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fazaa_requests fr
    JOIN public.fazaa_responses r ON r.request_id = fr.id
    WHERE fr.id = p_request_id
      AND fr.user_id = auth.uid()
      AND r.responder_id = p_responder_id
      AND r.accepted = true
      AND fr.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بتقييم هذه الفزعة';
  END IF;
  INSERT INTO public.user_ratings (request_id, rater_id, responder_id, rating)
  VALUES (p_request_id, auth.uid(), p_responder_id, p_rating)
  ON CONFLICT (request_id) DO NOTHING;
  RETURN true;
END;
$$;

-- ---------- (9) منع تعديل الطُعم بعد بدء التنفيذ ----------
CREATE OR REPLACE FUNCTION public.lock_request_on_progress()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'in_progress' THEN
    IF NEW.need IS DISTINCT FROM OLD.need
    OR NEW.price_jod IS DISTINCT FROM OLD.price_jod
    OR NEW.latitude IS DISTINCT FROM OLD.latitude
    OR NEW.longitude IS DISTINCT FROM OLD.longitude
    OR NEW.location IS DISTINCT FROM OLD.location
    OR NEW.category IS DISTINCT FROM OLD.category
    OR NEW.female_only IS DISTINCT FROM OLD.female_only THEN
      RAISE EXCEPTION 'لا يمكن تعديل تفاصيل الفزعة بعد بدء الاستجابة. ألغِ الطلب وأعد إنشائه إن لزم.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_lock_request_on_progress ON public.fazaa_requests;
CREATE TRIGGER tr_lock_request_on_progress
  BEFORE UPDATE ON public.fazaa_requests
  FOR EACH ROW EXECUTE FUNCTION public.lock_request_on_progress();

-- ---------- (3,4,5) RPC إتمام الفزعة (ذري) ----------
CREATE OR REPLACE FUNCTION public.confirm_fazaa_completion(p_request_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req record;
  v_responder uuid;
  v_pair_count int;
BEGIN
  SELECT * INTO v_req FROM public.fazaa_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
  IF v_req.status <> 'in_progress' THEN
    RAISE EXCEPTION 'لا يمكن تأكيد طلب ليس قيد التنفيذ';
  END IF;
  IF v_req.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'فقط صاحب الطلب يستطيع تأكيد الإتمام';
  END IF;

  SELECT responder_id INTO v_responder FROM public.fazaa_responses
  WHERE request_id = p_request_id AND accepted = true LIMIT 1;

  -- منع زراعة النقاط: نفس الطرفين أكملا فزعة خلال آخر 24 ساعة
  SELECT count(*) INTO v_pair_count
  FROM public.fazaa_requests fr
  JOIN public.fazaa_responses r ON r.request_id = fr.id
  WHERE fr.user_id = v_req.user_id AND r.responder_id = v_responder
    AND fr.status = 'completed' AND fr.created_at > now() - interval '24 hours';

  UPDATE public.fazaa_requests
  SET status = 'completed',
      latitude = NULL, longitude = NULL,
      location = 'موقع مخفي للخصوصية'
  WHERE id = p_request_id;

  IF v_pair_count = 0 AND v_responder IS NOT NULL THEN
    UPDATE public.profiles SET points = points + 10 WHERE id = v_responder;
  END IF;
  RETURN true;
END;
$$;

-- ---------- (5) الإغلاق التلقائي عبر pg_cron ----------
-- يتطلب تفعيل امتداد pg_cron من إعدادات Supabase
SELECT cron.schedule(
  'auto-close-stale-fazaa',
  '*/30 * * * *',
  $$
    UPDATE public.fazaa_requests
    SET status = 'expired', latitude = NULL, longitude = NULL
    WHERE status = 'in_progress' AND created_at < now() - interval '24 hours';
    UPDATE public.fazaa_requests
    SET status = 'expired'
    WHERE status = 'active' AND (
      (urgency = 'عاجلة اليوم' AND created_at < now() - interval '24 hours')
      OR (urgency <> 'عاجلة اليوم' AND created_at < now() - interval '7 days')
    );
  $$
);

-- ---------- (12) التجهيل عند حذف الحساب ----------
-- تعديل مفتاح الطلب الأجنبي ليكون SET NULL بدل الحذف المتسلسل
ALTER TABLE public.fazaa_requests
  DROP CONSTRAINT IF EXISTS fazaa_requests_user_id_fkey;
ALTER TABLE public.fazaa_requests
  ADD CONSTRAINT fazaa_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.anonymize_on_user_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.fazaa_requests
  SET requester_name = 'مستخدم محذوف'
  WHERE user_id = OLD.id;
  UPDATE public.fazaa_responses
  SET responder_name = 'مستخدم محذوف'
  WHERE responder_id = OLD.id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS tr_anonymize_on_user_delete ON auth.users;
CREATE TRIGGER tr_anonymize_on_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.anonymize_on_user_delete();
