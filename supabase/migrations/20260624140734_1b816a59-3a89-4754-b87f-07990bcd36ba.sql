
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_invited_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_discipleship_stage_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_discipleship_phase() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
