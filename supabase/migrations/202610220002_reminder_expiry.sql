begin;
alter table public.email_reminders add column if not exists expires_at timestamptz;
update public.email_reminders r set expires_at = k.expires_at
  from public.keys k where r.key_id = k.id and r.expires_at is null;
alter table public.email_reminders drop constraint if exists email_reminders_key_id_user_id_key;
create unique index if not exists email_reminders_expiry_idx
  on public.email_reminders (key_id, user_id, expires_at);
commit;
