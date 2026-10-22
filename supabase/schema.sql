begin;

-- API keys table (Phase 2)
create table if not exists public.keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  value_encrypted text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.keys enable row level security;

-- Owner can do everything on their own keys
drop policy if exists "Users can only access their own keys" on public.keys;
create policy "Users can only access their own keys"
  on public.keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists keys_user_id_idx on public.keys (user_id);

-- Phase 3: Organization columns
alter table public.keys add column if not exists category text;
alter table public.keys add column if not exists tags text[] not null default '{}';

-- Phase 4: Profiles mirror (email lookup for invites)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Profiles readable by authenticated" on public.profiles;
create policy "Profiles readable by authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');
drop policy if exists "Profiles owner write" on public.profiles;
create policy "Profiles owner write"
  on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- Phase 4: Key shares
create table if not exists public.key_shares (
  id uuid primary key default gen_random_uuid(),
  key_id uuid not null references public.keys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null default 'view' check (permission in ('view','edit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key_id, user_id)
);
alter table public.key_shares enable row level security;
drop policy if exists "Owner manages shares" on public.key_shares;
create policy "Owner manages shares"
  on public.key_shares for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "Sharee reads own shares" on public.key_shares;
create policy "Sharee reads own shares"
  on public.key_shares for select
  using (user_id = auth.uid());

-- Phase 4: Audit log
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  key_id uuid references public.keys(id) on delete set null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists "Audit insert by actor" on public.audit_log;
create policy "Audit insert by actor"
  on public.audit_log for insert
  with check (auth.uid() = actor_id);
drop policy if exists "Audit owner read" on public.audit_log;
create policy "Audit owner read"
  on public.audit_log for select
  using (exists (select 1 from public.keys k where k.id = key_id and k.user_id = auth.uid()));

-- Phase 4: Extend keys RLS for sharees
drop policy if exists "Sharees can read shared keys" on public.keys;
create policy "Sharees can read shared keys"
  on public.keys for select
  using (exists (select 1 from public.key_shares s
                 where s.key_id = keys.id and s.user_id = auth.uid()));
drop policy if exists "Edit sharees can update" on public.keys;
create policy "Edit sharees can update"
  on public.keys for update
  using (exists (select 1 from public.key_shares s
                 where s.key_id = keys.id and s.user_id = auth.uid()
                 and s.permission = 'edit'));

-- Phase 4: Indexes
create index if not exists key_shares_key_id_idx on public.key_shares (key_id);
create index if not exists key_shares_user_id_idx on public.key_shares (user_id);
create index if not exists audit_log_key_id_idx on public.audit_log (key_id);

-- Phase 5: Key expiry
alter table public.keys add column if not exists expires_at timestamptz;

-- Phase 5b: Fix circular RLS recursion between keys <-> key_shares.
-- Denormalize owner_id onto key_shares so the "Owner manages shares" policy
-- no longer subqueries keys (which recursed through the sharee read policy).
alter table public.key_shares add column if not exists owner_id uuid references auth.users(id) on delete cascade;
update public.key_shares as s
  set owner_id = k.user_id
  from public.keys as k
  where k.id = s.key_id and s.owner_id is null;
drop policy if exists "Owner manages shares" on public.key_shares;
create policy "Owner manages shares"
  on public.key_shares for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
drop policy if exists "Sharee reads own shares" on public.key_shares;
create policy "Sharee reads own shares"
  on public.key_shares for select
  using (user_id = auth.uid());

-- Phase 6: Remaining polish
-- Email reminder dedup
create table if not exists public.email_reminders (
  id uuid primary key default gen_random_uuid(),
  key_id uuid not null references public.keys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (key_id, user_id)
);
alter table public.email_reminders enable row level security;
drop policy if exists "Service role manages reminders" on public.email_reminders;
create policy "Service role manages reminders"
  on public.email_reminders for all
  using (true) with check (true);

-- Banner dismissals (per-user per-key)
create table if not exists public.key_dismissals (
  id uuid primary key default gen_random_uuid(),
  key_id uuid not null references public.keys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  unique (key_id, user_id)
);
alter table public.key_dismissals enable row level security;
drop policy if exists "Users manage own dismissals" on public.key_dismissals;
create policy "Users manage own dismissals"
  on public.key_dismissals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Rate-limit index
create index if not exists audit_log_actor_action_idx
  on public.audit_log (actor_id, action, created_at);

-- Phase 7: last viewed tracking
alter table public.keys add column if not exists last_viewed_at timestamptz;
create index if not exists keys_last_viewed_at_idx on public.keys (last_viewed_at);

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

alter table public.email_reminders add column if not exists expires_at timestamptz;
update public.email_reminders r set expires_at = k.expires_at
  from public.keys k where r.key_id = k.id and r.expires_at is null;
alter table public.email_reminders drop constraint if exists email_reminders_key_id_user_id_key;
create unique index if not exists email_reminders_expiry_idx
  on public.email_reminders (key_id, user_id, expires_at);
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

-- Auth invokes this trigger internally; browsers never need to execute it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;
