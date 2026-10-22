begin;
alter table public.audit_log add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.audit_log add column if not exists key_name text;
alter table public.audit_log add column if not exists actor_email text;
alter table public.audit_log alter column actor_id drop not null;
update public.audit_log a set owner_id = k.user_id, key_name = k.name
  from public.keys k where a.key_id = k.id and a.owner_id is null;
update public.audit_log a set actor_email = u.email
  from auth.users u where a.actor_id = u.id and a.actor_email is null;

drop policy if exists "Audit insert by actor" on public.audit_log;
drop policy if exists "Audit owner read" on public.audit_log;
create policy "Audit owner read" on public.audit_log for select to authenticated
  using (owner_id = auth.uid() or actor_id = auth.uid());
revoke insert, update, delete, truncate, references, trigger on public.audit_log from anon, authenticated;

create or replace function public.audit_key_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare snapshot public.keys; event text;
begin
  if tg_op = 'DELETE' then snapshot := old; event := 'delete';
  elsif tg_op = 'INSERT' then snapshot := new; event := 'create';
  else
    if row(new.name, new.value_encrypted, new.notes, new.category, new.tags, new.expires_at)
      is not distinct from row(old.name, old.value_encrypted, old.notes, old.category, old.tags, old.expires_at) then
      return new;
    end if;
    snapshot := new; event := 'edit';
  end if;
  if not exists (select 1 from auth.users where id = snapshot.user_id) then return coalesce(new, old); end if;
  insert into public.audit_log (key_id, owner_id, key_name, actor_id, actor_email, action)
    values (case when tg_op = 'DELETE' then null else snapshot.id end,
      snapshot.user_id, snapshot.name, (select id from auth.users where id = auth.uid()),
      (select email from auth.users where id = auth.uid()), event);
  return coalesce(new, old);
end $$;
drop trigger if exists audit_key_change on public.keys;
create trigger audit_key_change after insert or update or delete on public.keys
  for each row execute function public.audit_key_change();

create or replace function public.audit_share_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare snapshot public.key_shares; target public.keys;
begin
  if tg_op = 'DELETE' then snapshot := old; else snapshot := new; end if;
  if tg_op = 'UPDATE' and new.permission = old.permission and new.user_id = old.user_id then return new; end if;
  select * into target from public.keys where id = snapshot.key_id;
  -- Deleting a key already produces its own durable event.
  if not found then return coalesce(new, old); end if;
  insert into public.audit_log (key_id, owner_id, key_name, actor_id, actor_email, action)
    values (target.id, target.user_id, target.name, (select id from auth.users where id = auth.uid()),
      (select email from auth.users where id = auth.uid()),
      case when tg_op = 'DELETE' then 'revoke' else 'share' end);
  return coalesce(new, old);
end $$;
drop trigger if exists audit_share_change on public.key_shares;
create trigger audit_share_change after insert or update or delete on public.key_shares
  for each row execute function public.audit_share_change();

create or replace function public.record_key_access(p_key_id uuid, p_action text)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.keys; actor uuid := auth.uid();
begin
  if actor is null or p_action not in ('view', 'copy') then
    raise exception 'Invalid key access' using errcode = '42501';
  end if;
  select * into target from public.keys k where k.id = p_key_id and
    (k.user_id = actor or exists (select 1 from public.key_shares s where s.key_id = k.id and s.user_id = actor));
  if not found then raise exception 'Key not found' using errcode = '42501'; end if;
  if target.expires_at <= now() then raise exception 'This key has expired and cannot be revealed or copied'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  if (select count(*) from public.audit_log where actor_id = actor and action in ('view', 'copy') and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Rate limit exceeded. Please try again in a minute.';
  end if;
  insert into public.audit_log (key_id, owner_id, key_name, actor_id, actor_email, action)
    values (target.id, target.user_id, target.name, actor,
      (select email from auth.users where id = actor), p_action);
  if p_action = 'view' then update public.keys set last_viewed_at = now() where id = target.id; end if;
end $$;
revoke all on function public.record_key_access(uuid, text) from public, anon;
grant execute on function public.record_key_access(uuid, text) to authenticated;
revoke all on function public.audit_key_change(), public.audit_share_change() from public, anon, authenticated;
create index if not exists audit_log_owner_created_idx on public.audit_log (owner_id, created_at desc);
commit;
