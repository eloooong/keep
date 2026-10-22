begin;

-- Keep the denormalized owner tied to the actual key without recursive RLS.
create unique index if not exists keys_id_user_id_idx on public.keys (id, user_id);
alter table public.key_shares alter column owner_id set not null;
alter table public.key_shares drop constraint if exists key_shares_key_owner_fkey;
alter table public.key_shares add constraint key_shares_key_owner_fkey
  foreign key (key_id, owner_id) references public.keys (id, user_id) on delete cascade;

-- An editor can edit content, but cannot take ownership or replace a key's ID.
create or replace function public.protect_key_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id then
    raise exception 'Key identity and ownership cannot be changed' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists protect_key_identity on public.keys;
create trigger protect_key_identity before update on public.keys
  for each row execute function public.protect_key_identity();

-- Profile email is an auth-managed identity, never a client-editable field.
drop policy if exists "Profiles owner write" on public.profiles;
revoke insert, update, delete, truncate, references, trigger on public.profiles from anon, authenticated;
insert into public.profiles (id, email)
  select id, email from auth.users where email is not null
  on conflict (id) do update set email = excluded.email;

-- No browser role may read or manufacture email-delivery records.
drop policy if exists "Service role manages reminders" on public.email_reminders;
revoke all on public.email_reminders from anon, authenticated;
grant all on public.email_reminders to service_role;

drop policy if exists "Users manage own dismissals" on public.key_dismissals;
create policy "Users manage own dismissals" on public.key_dismissals
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (
    select 1 from public.keys k where k.id = key_id
  ));

commit;
