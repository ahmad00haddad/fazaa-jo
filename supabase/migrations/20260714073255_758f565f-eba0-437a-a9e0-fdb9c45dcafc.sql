
-- =============================================================
-- Security hardening: fazaa_responses RLS, gender-only bypass,
-- authenticated-only reads, revoke anon EXECUTE on definer fns.
-- =============================================================

-- ---------- fazaa_responses: SELECT restricted to owner + responder ----------
DROP POLICY IF EXISTS "Enable read access for related users" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Responses viewable by requester and responder" ON public.fazaa_responses;
CREATE POLICY "Responses viewable by requester and responder"
  ON public.fazaa_responses FOR SELECT
  TO authenticated
  USING (
    auth.uid() = responder_id
    OR auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = request_id)
  );

-- ---------- fazaa_responses: UPDATE restricted (responder edits own; requester accepts) ----------
DROP POLICY IF EXISTS "Enable update for related users" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Responder can edit own response" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Requester can accept response" ON public.fazaa_responses;

CREATE POLICY "Responder can edit own response"
  ON public.fazaa_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = responder_id)
  WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Requester can accept response"
  ON public.fazaa_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = request_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.fazaa_requests WHERE id = request_id));

-- ---------- fazaa_responses: INSERT enforces gender_visibility / female_only ----------
CREATE OR REPLACE FUNCTION public.can_respond_to_request(_request_id uuid, _responder_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_female_only boolean;
  v_gender_vis text;
  v_gender text;
BEGIN
  SELECT status, female_only, gender_visibility
    INTO v_status, v_female_only, v_gender_vis
  FROM public.fazaa_requests WHERE id = _request_id;
  IF NOT FOUND OR v_status <> 'active' THEN RETURN false; END IF;

  SELECT gender INTO v_gender FROM public.profiles WHERE id = _responder_id;

  IF v_female_only = true OR v_gender_vis = 'female_only' THEN
    RETURN v_gender = 'female';
  END IF;
  IF v_gender_vis = 'male_only' THEN
    RETURN v_gender = 'male';
  END IF;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.can_respond_to_request(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_respond_to_request(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.fazaa_responses;
DROP POLICY IF EXISTS "Users can insert responses for themselves" ON public.fazaa_responses;
CREATE POLICY "Users can insert responses for themselves"
  ON public.fazaa_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = responder_id
    AND public.can_respond_to_request(request_id, auth.uid())
  );

-- ---------- offer_help_rpc: server-side gender guard ----------
CREATE OR REPLACE FUNCTION public.offer_help_rpc(
  p_message text,
  p_offered_price_jod integer,
  p_request_id uuid,
  p_request_owner_id uuid,
  p_responder_id uuid,
  p_responder_name text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_responder_id THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;
  IF NOT public.can_respond_to_request(p_request_id, auth.uid()) THEN
    RAISE EXCEPTION 'لا يمكنك الاستجابة لهذا الطلب';
  END IF;
  INSERT INTO public.fazaa_responses (request_id, responder_id, responder_name, message, offered_price_jod)
  VALUES (p_request_id, p_responder_id, p_responder_name, p_message, p_offered_price_jod);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.offer_help_rpc(text, integer, uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_help_rpc(text, integer, uuid, uuid, uuid, text) TO authenticated;

-- ---------- profiles + fazaa_requests: authenticated-only reads ----------
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Gender aware read policy for fazaa_requests" ON public.fazaa_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.fazaa_requests;
CREATE POLICY "Fazaa requests readable by authenticated"
  ON public.fazaa_requests FOR SELECT
  TO authenticated
  USING (
    gender_visibility IS NULL
    OR gender_visibility = 'all'
    OR user_id = auth.uid()
    OR (gender_visibility = 'female_only'
        AND (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'female')
    OR (gender_visibility = 'male_only'
        AND (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'male')
  );

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.fazaa_requests FROM anon;

-- ---------- Revoke EXECUTE on SECURITY DEFINER functions from anon/PUBLIC ----------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;',
                   r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated;',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;
