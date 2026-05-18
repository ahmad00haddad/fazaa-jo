
-- 1) Fazaa Points
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.award_points_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.profiles p
    SET points = p.points + 10
    FROM public.fazaa_responses r
    WHERE r.request_id = NEW.id
      AND r.accepted = true
      AND p.id = r.responder_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_points_on_complete ON public.fazaa_requests;
CREATE TRIGGER trg_award_points_on_complete
AFTER UPDATE ON public.fazaa_requests
FOR EACH ROW EXECUTE FUNCTION public.award_points_on_complete();

-- Allow everyone authenticated to see basic profile info (name + points + verified) for leaderboards
CREATE POLICY "Public read of name points verified"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2) Area Watch
CREATE TABLE IF NOT EXISTS public.area_watch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '4 hours')
);

CREATE INDEX IF NOT EXISTS idx_area_watch_city_expires ON public.area_watch(city, expires_at);

ALTER TABLE public.area_watch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view active watchers"
ON public.area_watch
FOR SELECT
TO authenticated
USING (expires_at > now());

CREATE POLICY "Users create own watch"
ON public.area_watch
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own watch"
ON public.area_watch
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
