
-- 1) SET search_path on all SECURITY DEFINER / other functions missing it
ALTER FUNCTION public.accept_response_rpc(uuid, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.active_watchers_count() SET search_path = public;
ALTER FUNCTION public.confirm_fazaa_completion(uuid) SET search_path = public;
ALTER FUNCTION public.expire_urgent_fazaa_requests() SET search_path = public;
ALTER FUNCTION public.get_responder_phone(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_gender(uuid) SET search_path = public;
ALTER FUNCTION public.is_request_owner(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.mark_self_verified() SET search_path = public;
ALTER FUNCTION public.monthly_top_helper() SET search_path = public;
ALTER FUNCTION public.normalize_jordan_phone(text) SET search_path = public;
ALTER FUNCTION public.request_is_female_only(uuid) SET search_path = public;
ALTER FUNCTION public.requests_in_view(double precision, double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.submit_rating(integer, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_completed_count(uuid) SET search_path = public;
ALTER FUNCTION public.weekly_leaderboard(integer) SET search_path = public;

-- 2) Revoke EXECUTE from PUBLIC/anon on SECURITY DEFINER functions; grant only to authenticated + service_role
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;', r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role;', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- 3) Tighten fazaa_responses policies: authenticated only, strict ownership
DROP POLICY IF EXISTS "Responses viewable by requester and responder" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Requester can accept response" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Responder can edit own response" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Enable delete for related users" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Users can insert responses for themselves" ON public.fazaa_responses;

CREATE POLICY "Responses select owner or responder"
ON public.fazaa_responses FOR SELECT TO authenticated
USING (
  auth.uid() = responder_id
  OR auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = fazaa_responses.request_id)
);

CREATE POLICY "Responder can edit own response"
ON public.fazaa_responses FOR UPDATE TO authenticated
USING (auth.uid() = responder_id)
WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Requester can accept response"
ON public.fazaa_responses FOR UPDATE TO authenticated
USING (auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = fazaa_responses.request_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = fazaa_responses.request_id));

CREATE POLICY "Responder or requester can delete"
ON public.fazaa_responses FOR DELETE TO authenticated
USING (
  auth.uid() = responder_id
  OR auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = fazaa_responses.request_id)
);

-- 4) Enforce gender restriction fully server-side on INSERT
CREATE POLICY "Insert response with gender enforcement"
ON public.fazaa_responses FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = responder_id
  AND public.can_respond_to_request(request_id, auth.uid())
);

-- 5) Also enforce gender in offer_help_rpc explicitly (belt-and-suspenders)
CREATE OR REPLACE FUNCTION public.offer_help_rpc(
  p_message text, p_offered_price_jod integer, p_request_id uuid,
  p_request_owner_id uuid, p_responder_id uuid, p_responder_name text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_female_only boolean;
  v_gender_vis text;
  v_status text;
  v_gender text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_responder_id THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT status, female_only, gender_visibility
    INTO v_status, v_female_only, v_gender_vis
  FROM public.fazaa_requests WHERE id = p_request_id;

  IF NOT FOUND OR v_status <> 'active' THEN
    RAISE EXCEPTION 'الطلب غير متاح';
  END IF;

  SELECT gender INTO v_gender FROM public.profiles WHERE id = auth.uid();

  IF (v_female_only = true OR v_gender_vis = 'female_only') AND v_gender <> 'female' THEN
    RAISE EXCEPTION 'هذا الطلب للإناث فقط';
  END IF;
  IF v_gender_vis = 'male_only' AND v_gender <> 'male' THEN
    RAISE EXCEPTION 'هذا الطلب للذكور فقط';
  END IF;

  INSERT INTO public.fazaa_responses (request_id, responder_id, responder_name, message, offered_price_jod)
  VALUES (p_request_id, p_responder_id, p_responder_name, p_message, p_offered_price_jod);
END;
$$;

REVOKE ALL ON FUNCTION public.offer_help_rpc(text, integer, uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_help_rpc(text, integer, uuid, uuid, uuid, text) TO authenticated, service_role;
