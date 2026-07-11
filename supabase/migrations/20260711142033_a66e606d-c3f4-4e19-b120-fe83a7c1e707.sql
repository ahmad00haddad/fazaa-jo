
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.expire_urgent_fazaa_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.fazaa_requests
     SET status = 'cancelled'
   WHERE status = 'active'
     AND urgency = 'عاجلة اليوم'
     AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_urgent_fazaa_requests() FROM PUBLIC, anon, authenticated;

-- Run existing cleanup once immediately
SELECT public.expire_urgent_fazaa_requests();

-- Schedule every 15 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire_urgent_fazaa_requests') THEN
    PERFORM cron.unschedule('expire_urgent_fazaa_requests');
  END IF;
  PERFORM cron.schedule(
    'expire_urgent_fazaa_requests',
    '*/15 * * * *',
    $cron$ SELECT public.expire_urgent_fazaa_requests(); $cron$
  );
END $$;
