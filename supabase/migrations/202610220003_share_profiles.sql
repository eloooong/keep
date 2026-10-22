begin;
drop policy if exists "Profiles readable by authenticated" on public.profiles;
drop policy if exists "Profiles visible to self and key owners" on public.profiles;
create policy "Profiles visible to self and key owners" on public.profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.key_shares s where s.user_id = profiles.id and s.owner_id = auth.uid()
  ));

create or replace function public.find_share_recipient(p_key_id uuid, p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  if not exists (select 1 from public.keys where id = p_key_id and user_id = auth.uid()) then
    raise exception 'Key not found' using errcode = '42501';
  end if;
  select id into recipient from auth.users where lower(email) = lower(trim(p_email));
  return recipient;
end $$;
revoke all on function public.find_share_recipient(uuid, text) from public, anon;
grant execute on function public.find_share_recipient(uuid, text) to authenticated;
commit;
