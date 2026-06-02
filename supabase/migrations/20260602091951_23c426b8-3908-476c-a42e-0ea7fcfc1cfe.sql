
-- 1. Profiles: hide phone column from broad reads via column-level grants
DROP POLICY IF EXISTS "Public read of name points verified" ON public.profiles;

CREATE POLICY "Authenticated read public profile fields"
  ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, name, gender, city, verified, points, phone_verified, avatar_url, created_at, updated_at)
  ON public.profiles TO authenticated;
-- Owner still needs to write phone; column UPDATE/INSERT grants remain default (table-level)
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Secure RPCs to read phone numbers only for authorized callers
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_responder_phone(_responder_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.phone FROM public.profiles p
  WHERE p.id = _responder_id
    AND EXISTS (
      SELECT 1 FROM public.fazaa_responses r
      JOIN public.fazaa_requests req ON req.id = r.request_id
      WHERE r.responder_id = _responder_id
        AND req.user_id = auth.uid()
        AND r.accepted = true
    );
$$;
REVOKE EXECUTE ON FUNCTION public.get_responder_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_responder_phone(uuid) TO authenticated;

-- 3. Lock down anon execution on existing SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.request_is_female_only(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_gender(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_request_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_is_female_only(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_gender(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_owner(uuid, uuid) TO authenticated;

-- 4. Storage: stop public listing of avatars bucket
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
-- Public bucket files remain accessible via getPublicUrl direct URLs.

-- 5. Realtime: restrict channel subscriptions to authenticated users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated realtime subscribe" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated realtime subscribe" ON realtime.messages FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
