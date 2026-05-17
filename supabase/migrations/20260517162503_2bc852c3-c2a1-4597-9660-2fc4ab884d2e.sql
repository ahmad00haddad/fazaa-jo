
-- 1) Profiles: verified + city
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS city text;

-- 2) Fazaa requests: female_only + city + status
ALTER TABLE public.fazaa_requests
  ADD COLUMN IF NOT EXISTS female_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- 3) Helper: check requester gender for female-only restriction
CREATE OR REPLACE FUNCTION public.get_user_gender(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gender FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.request_is_female_only(_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT female_only FROM public.fazaa_requests WHERE id = _request_id;
$$;

-- 4) Replace feed SELECT policy: only active to others, owner sees own always
DROP POLICY IF EXISTS "Authenticated view all requests" ON public.fazaa_requests;
CREATE POLICY "Active requests visible to authenticated"
ON public.fazaa_requests FOR SELECT TO authenticated
USING (status = 'active' OR auth.uid() = user_id);

-- 5) Owner can update status (complete/cancel) of own request
CREATE POLICY "Owner updates own request"
ON public.fazaa_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6) Tighten responses INSERT: female-only requests only accept female responders
DROP POLICY IF EXISTS "Users create own response" ON public.fazaa_responses;
CREATE POLICY "Users create own response"
ON public.fazaa_responses FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = responder_id
  AND NOT public.is_request_owner(request_id, auth.uid())
  AND (
    public.request_is_female_only(request_id) = false
    OR public.get_user_gender(auth.uid()) = 'female'
  )
);

-- 7) Email-verified -> mark profile verified (self-service)
CREATE OR REPLACE FUNCTION public.mark_self_verified()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE confirmed timestamptz;
BEGIN
  SELECT email_confirmed_at INTO confirmed FROM auth.users WHERE id = auth.uid();
  IF confirmed IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.profiles SET verified = true WHERE id = auth.uid();
  RETURN true;
END;
$$;

-- 8) Realtime for fazaa_requests
ALTER TABLE public.fazaa_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fazaa_requests;
