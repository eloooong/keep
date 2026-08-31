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
