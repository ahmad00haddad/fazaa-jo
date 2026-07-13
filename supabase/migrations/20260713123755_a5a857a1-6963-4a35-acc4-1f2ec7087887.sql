CREATE OR REPLACE FUNCTION public.requests_in_view(min_lat double precision, min_long double precision, max_lat double precision, max_long double precision)
RETURNS SETOF public.fazaa_requests
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.fazaa_requests
  WHERE status IN ('active','in_progress')
    AND latitude IS NOT NULL AND longitude IS NOT NULL
    AND latitude BETWEEN min_lat AND max_lat
    AND longitude BETWEEN min_long AND max_long
    AND (
      female_only = false
      OR (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'female'
      OR user_id = auth.uid()
    )
  ORDER BY created_at DESC
  LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.requests_in_view(double precision,double precision,double precision,double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requests_in_view(double precision,double precision,double precision,double precision) TO authenticated, service_role;