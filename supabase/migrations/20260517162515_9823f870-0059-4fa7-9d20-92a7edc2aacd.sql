
REVOKE EXECUTE ON FUNCTION public.get_user_gender(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_is_female_only(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_request_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_self_verified() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_self_verified() TO authenticated;
