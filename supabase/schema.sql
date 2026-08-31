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
