
-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_self_select" ON public.notifications;
CREATE POLICY "notif_self_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_self_update" ON public.notifications;
CREATE POLICY "notif_self_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);

-- user_ratings
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.fazaa_requests(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, rater_id, responder_id)
);

GRANT SELECT ON public.user_ratings TO authenticated;
GRANT ALL ON public.user_ratings TO service_role;

ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_read_all_auth" ON public.user_ratings;
CREATE POLICY "ratings_read_all_auth" ON public.user_ratings
  FOR SELECT TO authenticated USING (true);
-- Inserts happen only through submit_rating() which is SECURITY DEFINER.

-- offer_help_rpc
CREATE OR REPLACE FUNCTION public.offer_help_rpc(
  p_request_id uuid,
  p_request_owner_id uuid,
  p_responder_id uuid,
  p_responder_name text,
  p_message text,
  p_offered_price_jod numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_responder_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fazaa_requests
    WHERE id = p_request_id AND status = 'active' AND user_id <> p_responder_id
  ) THEN
    RAISE EXCEPTION 'الطلب غير متاح';
  END IF;

  INSERT INTO public.fazaa_responses (request_id, responder_id, responder_name, message, offered_price_jod)
  VALUES (p_request_id, p_responder_id, p_responder_name, p_message, p_offered_price_jod)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (p_request_owner_id, 'فزعة جديدة!', p_responder_name || ' عرض تقديم المساعدة في طلبك', '/fazaa');
END $$;

REVOKE EXECUTE ON FUNCTION public.offer_help_rpc(uuid, uuid, uuid, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_help_rpc(uuid, uuid, uuid, text, text, numeric) TO authenticated;
