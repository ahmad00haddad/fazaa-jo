
-- 1) area_watch: restrict SELECT to own row only
DROP POLICY IF EXISTS "Authenticated view active watchers" ON public.area_watch;
CREATE POLICY "Users view own active watch"
  ON public.area_watch
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND expires_at > now());

-- Aggregate-only helper (no identity exposure)
CREATE OR REPLACE FUNCTION public.active_watchers_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.area_watch WHERE expires_at > now();
$$;
REVOKE ALL ON FUNCTION public.active_watchers_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.active_watchers_count() TO authenticated;

-- 2) Revoke anon EXECUTE on SECURITY DEFINER functions that shouldn't be public
REVOKE ALL ON FUNCTION public.user_completed_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_completed_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.weekly_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.monthly_top_helper() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.monthly_top_helper() TO authenticated;

REVOKE ALL ON FUNCTION public.award_points_on_complete() FROM PUBLIC, anon;
