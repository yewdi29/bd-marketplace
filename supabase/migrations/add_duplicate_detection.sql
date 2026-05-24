-- ============================================================
-- Add company name duplicate flag and email domain columns
-- Used by signup route for soft duplicate detection
-- ============================================================

alter table public.users
  add column if not exists company_name_duplicate boolean default false,
  add column if not exists email_domain text;

-- Index for admin queries by email domain
create index if not exists users_email_domain_idx on public.users (email_domain);
