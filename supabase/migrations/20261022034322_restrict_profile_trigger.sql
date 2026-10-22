begin;
-- Auth invokes this trigger internally; browsers never need to execute it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
commit;
