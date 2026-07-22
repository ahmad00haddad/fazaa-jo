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


-- =================================================================================
-- 2. FIX: AI Edge Functions Rate Limiting
-- =================================================================================

-- Create table to track API requests for rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast counts
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_created 
ON public.api_rate_limits (user_id, created_at);

-- RLS for api_rate_limits (no one should read/write except backend functions/RPCs)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RPC to check and log rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_endpoint text,
  p_max_requests integer,
  p_window_minutes integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_count integer;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1) Count requests in the given window
  SELECT count(*) INTO v_request_count
  FROM public.api_rate_limits
  WHERE user_id = v_user_id 
    AND endpoint = p_endpoint 
    AND created_at >= (now() - (p_window_minutes || ' minutes')::interval);

  -- 2) Check if limit exceeded
  IF v_request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- 3) Log this new request
  INSERT INTO public.api_rate_limits (user_id, endpoint)
  VALUES (v_user_id, p_endpoint);

  RETURN true;
END;
$$;
