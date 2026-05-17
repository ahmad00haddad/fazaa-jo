
ALTER TABLE public.fazaa_requests
  ADD COLUMN IF NOT EXISTS requester_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_requester_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT verified INTO NEW.requester_verified FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.requester_verified IS NULL THEN
    NEW.requester_verified := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_requester_verified ON public.fazaa_requests;
CREATE TRIGGER trg_set_requester_verified
BEFORE INSERT ON public.fazaa_requests
FOR EACH ROW EXECUTE FUNCTION public.set_requester_verified();

REVOKE EXECUTE ON FUNCTION public.set_requester_verified() FROM PUBLIC, anon, authenticated;
