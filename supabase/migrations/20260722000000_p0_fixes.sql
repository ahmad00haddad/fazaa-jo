-- =================================================================================
-- 1. FIX: offer_help_rpc Gender Bypass
-- =================================================================================

CREATE OR REPLACE FUNCTION offer_help_rpc(
  p_request_id uuid,
  p_request_owner_id uuid,
  p_responder_id uuid,
  p_responder_name text,
  p_message text,
  p_offered_price_jod numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_female_only boolean;
  v_responder_gender text;
BEGIN
  -- 1) Fetch the request female_only flag
  SELECT female_only INTO v_is_female_only
  FROM public.fazaa_requests
  WHERE id = p_request_id;

  IF v_is_female_only IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- 2) If it is female only, check the responder's gender
  IF v_is_female_only THEN
    SELECT gender INTO v_responder_gender
    FROM public.profiles
    WHERE id = p_responder_id;

    IF v_responder_gender IS NULL OR v_responder_gender != 'female' THEN
      RAISE EXCEPTION 'Not authorized: This request is restricted to female responders only.';
    END IF;
  END IF;

  -- Insert the response
  INSERT INTO public.fazaa_responses (request_id, responder_id, responder_name, message, offered_price_jod)
  VALUES (p_request_id, p_responder_id, p_responder_name, p_message, p_offered_price_jod);

  -- Insert the notification securely
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (p_request_owner_id, 'فزعة جديدة!', p_responder_name || ' عرض تقديم المساعدة في طلبك', '/fazaa');
END;
$$;
