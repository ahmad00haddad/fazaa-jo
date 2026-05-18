GRANT EXECUTE ON FUNCTION public.is_request_owner(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.request_is_female_only(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_gender(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mark_self_verified() TO authenticated;