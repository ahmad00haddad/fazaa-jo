-- Pricing
ALTER TABLE public.fazaa_requests ADD COLUMN IF NOT EXISTS price_jod numeric NOT NULL DEFAULT 0;
ALTER TABLE public.fazaa_responses ADD COLUMN IF NOT EXISTS offered_price_jod numeric;

-- Phone verified flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

-- Phone normalization
CREATE OR REPLACE FUNCTION public.normalize_jordan_phone(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE digits text;
BEGIN
  digits := regexp_replace(coalesce(p, ''), '\D', '', 'g');
  IF digits = '' THEN RETURN ''; END IF;
  digits := regexp_replace(digits, '^00', '');
  IF length(digits) = 10 AND left(digits,1) = '0' THEN
    digits := '962' || substring(digits from 2);
  ELSIF length(digits) = 9 AND left(digits,1) = '7' THEN
    digits := '962' || digits;
  END IF;
  RETURN digits;
END $$;

UPDATE public.profiles
SET phone = public.normalize_jordan_phone(phone)
WHERE phone IS NOT NULL AND phone <> '';

CREATE OR REPLACE FUNCTION public.profiles_normalize_phone_trg()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.phone := public.normalize_jordan_phone(NEW.phone);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_normalize_phone ON public.profiles;
CREATE TRIGGER trg_profiles_normalize_phone
BEFORE INSERT OR UPDATE OF phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_normalize_phone_trg();

-- Phone verifications table
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own phone verifications" ON public.phone_verifications;
CREATE POLICY "Users manage own phone verifications"
ON public.phone_verifications
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Completed Fazaas count per user (as responder)
CREATE OR REPLACE FUNCTION public.user_completed_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.fazaa_responses r
  JOIN public.fazaa_requests q ON q.id = r.request_id
  WHERE r.responder_id = _user_id
    AND r.accepted = true
    AND q.status = 'completed';
$$;

-- Weekly leaderboard
CREATE OR REPLACE FUNCTION public.weekly_leaderboard(_limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, name text, city text, completed_count bigint, verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.name,
    p.city,
    count(*) AS completed_count,
    p.verified
  FROM public.fazaa_responses r
  JOIN public.fazaa_requests q ON q.id = r.request_id
  JOIN public.profiles p ON p.id = r.responder_id
  WHERE r.accepted = true
    AND q.status = 'completed'
    AND q.created_at >= (now() - interval '7 days')
  GROUP BY p.id, p.name, p.city, p.verified
  ORDER BY completed_count DESC, p.name ASC
  LIMIT _limit;
$$;

-- Monthly top helper "أبو الفزعات"
CREATE OR REPLACE FUNCTION public.monthly_top_helper()
RETURNS TABLE(user_id uuid, name text, city text, completed_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.city, count(*) AS completed_count
  FROM public.fazaa_responses r
  JOIN public.fazaa_requests q ON q.id = r.request_id
  JOIN public.profiles p ON p.id = r.responder_id
  WHERE r.accepted = true
    AND q.status = 'completed'
    AND q.created_at >= date_trunc('month', now())
  GROUP BY p.id, p.name, p.city
  ORDER BY completed_count DESC
  LIMIT 1;
$$;