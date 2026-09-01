-- Syncable email verification timestamp for admin filtering.
-- Source of truth remains auth.users.email_confirmed_at; this column is
-- stamped when signup OTP / confirm succeeds and backfilled for existing users.

alter table public.users
  add column if not exists email_verified_at timestamptz;

comment on column public.users.email_verified_at is
  'When the user completed email verification (OTP / confirm link). Null = pending.';

-- Backfill from Auth for already-confirmed accounts
update public.users u
set email_verified_at = au.email_confirmed_at
from auth.users au
where au.id = u.id
  and au.email_confirmed_at is not null
  and u.email_verified_at is null;

create index if not exists users_email_verified_at_idx
  on public.users (email_verified_at);
